use crate::BlockNum;
use crate::Error;
use crate::EthRpcError;
use cached::proc_macro::cached;
use cached::TimedSizedCache;
use serde::Deserialize;
use serde::Serialize;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::env;
use std::env::VarError;
use std::str::FromStr;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tokio::sync::Semaphore;

const NUM_MAINNET_NODES: u32 = 10;

/// Permits for throttling the requests to the Ethereum JSON-RPC API  
pub static PERMITS: Semaphore = Semaphore::const_new(100);

#[derive(Debug, Copy, Clone, Hash, PartialEq, Eq, Serialize, Deserialize)]
pub enum Chain {
    Mainnet,
    Optimism,
    Base,
    Arbitrum,
    Blast,
}

impl FromStr for Chain {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "mainnet" => Ok(Chain::Mainnet),
            "optimism" => Ok(Chain::Optimism),
            "base" => Ok(Chain::Base),
            "arbitrum" => Ok(Chain::Arbitrum),
            "blast" => Ok(Chain::Blast),
            _ => Err(format!("Invalid chain: {}", s)),
        }
    }
}

/// A load balancer to distribute requests across multiple RPC endpoints
struct LoadBalancer {
    next_client_index: u32,
}

impl LoadBalancer {
    pub fn new() -> Self {
        Self {
            next_client_index: 0,
        }
    }

    pub fn get_endpoint(&mut self, chain: Chain) -> Result<String, VarError> {
        if chain == Chain::Blast {
            return env::var("BLAST_RPC_URL");
        }

        let api_key = match chain {
            Chain::Mainnet => env::var(format!("ALCHEMY_API_KEY_{}", self.next_client_index))?,
            Chain::Optimism => env::var("ALCHEMY_OPT_API_KEY")?,
            Chain::Base => env::var("ALCHEMY_BASE_API_KEY")?,
            Chain::Arbitrum => env::var("ALCHEMY_ARB_API_KEY")?,
            Chain::Blast => "".to_string(),
        };

        let subdomain = match chain {
            Chain::Mainnet => "eth-mainnet",
            Chain::Optimism => "opt-mainnet",
            Chain::Base => "base-mainnet",
            Chain::Arbitrum => "arb-mainnet",
            Chain::Blast => "",
        };

        let url = format!("https://{}.g.alchemy.com/v2/{}", subdomain, api_key);

        self.next_client_index = (self.next_client_index + 1) % NUM_MAINNET_NODES;
        Ok(url)
    }
}

#[cached(
    type = "TimedSizedCache<String, BlockNum>",
    create = "{ TimedSizedCache::with_size_and_lifespan(100, 12) }",
    convert = r#"{ format!("{}", url) }"#,
    result = true
)]
/// Get the latest block number for a chain
/// Caches the result for 12 seconds
async fn get_block_number(client: &surf::Client, url: &str) -> Result<BlockNum, Error> {
    let permit = PERMITS.acquire().await.unwrap();

    let delay = rand::random::<u64>() % 500;
    tokio::time::sleep(Duration::from_millis(delay)).await;

    let mut res = client
        .post(url)
        .body_json(&json!({
            "jsonrpc": "2.0",
            "method": "eth_getBlockByNumber",
            "params": ["finalized", false],
            "id": 0,
        }))?
        .await?;

    drop(permit);

    let body_str = res.body_string().await?;

    let body: Value = serde_json::from_str(&body_str).unwrap();

    let error = body["error"].as_object();

    if error.is_some() {
        let err = EthRpcError {
            message: error.unwrap()["message"].as_str().unwrap().to_string(),
        };

        return Err(Error::EthRpc(err));
    }

    let finalized_block_number = body["result"]["number"].as_str();

    if finalized_block_number.is_none() {
        return Err(Error::EthRpc(EthRpcError {
            message: "Failed to get finalized block number".to_string(),
        }));
    }

    let finalized_block = u64::from_str_radix(
        body["result"]["number"]
            .as_str()
            .unwrap()
            .trim_start_matches("0x"),
        16,
    )
    .unwrap();

    Ok(finalized_block)
}

/// A client for interacting with the Ethereum JSON-RPC API
pub struct EthRpcClient {
    client: Arc<surf::Client>,
    load_balancer: Arc<Mutex<LoadBalancer>>,
}

impl Default for EthRpcClient {
    fn default() -> Self {
        Self::new()
    }
}

impl EthRpcClient {
    pub fn new() -> Self {
        let client: surf::Client = surf::Config::new()
            .set_max_connections_per_host(0) // Unlimited connections
            .set_timeout(Some(Duration::from_secs(60 * 20))) // 20 minutes
            .try_into()
            .unwrap();
        Self {
            client: Arc::new(client),
            load_balancer: Arc::new(Mutex::new(LoadBalancer::new())),
        }
    }

    /// Get the latest block number for a chain
    pub async fn get_block_number(&self, chain: Chain) -> Result<BlockNum, Error> {
        let mut load_balancer = self.load_balancer.lock().await;
        let url = load_balancer.get_endpoint(chain).unwrap();
        drop(load_balancer);

        // Call the cached function to get the block number
        get_block_number(&self.client, &url).await
    }

    /// Get logs for a contract event in batch
    /// - `batch_options`: An array of `[fromBlock, toBlock]` options
    pub async fn get_logs(&self, chain: Chain, params: &Value) -> Result<Value, surf::Error> {
        let mut load_balancer = self.load_balancer.lock().await;
        let url = load_balancer.get_endpoint(chain).unwrap();
        drop(load_balancer);

        let delay = rand::random::<u64>() % 500;
        tokio::time::sleep(Duration::from_millis(delay)).await;

        let permit = PERMITS.acquire().await.unwrap();

        let mut res = self
            .client
            .post(url)
            .body_json(&json!({
                "jsonrpc": "2.0",
                "method": "eth_getLogs",
                "params": vec![params],
                "id": 1,
            }))?
            .await?;

        drop(permit);

        let body_str = res.body_string().await?;

        Ok(serde_json::from_str(&body_str).unwrap())
    }

    /// Get logs for a contract event in batch
    /// - `batch_options`: An array of `[fromBlock, toBlock]` options
    pub async fn get_logs_batch(
        &self,
        chain: Chain,
        address: &str,
        event_signature: &str,
        batch_options: &[[BlockNum; 2]],
    ) -> Result<Value, surf::Error> {
        let mut load_balancer = self.load_balancer.lock().await;
        let url = load_balancer.get_endpoint(chain).unwrap();
        drop(load_balancer);

        let mut json_body = vec![];

        for (i, batch_option) in batch_options.iter().enumerate() {
            let from_block = batch_option[0];
            let to_block = batch_option[1];
            json_body.push(json!({
                "jsonrpc": "2.0",
                "method": "eth_getLogs",
                "params": [
                    {
                        "topics": [event_signature],
                        "address": address,
                        "fromBlock": format!("0x{:x}", from_block),
                        "toBlock": format!("0x{:x}", to_block),
                    }
                ],
                "id": i,
            }));
        }

        let delay = rand::random::<u64>() % 500;
        tokio::time::sleep(Duration::from_millis(delay)).await;

        let permit = PERMITS.acquire().await.unwrap();

        let mut res = self.client.post(url).body_json(&json!(json_body))?.await?;

        drop(permit);

        let body_str = res.body_string().await?;

        Ok(serde_json::from_str(&body_str).unwrap())
    }

    pub async fn get_block_timestamp_batch(
        &self,
        chain: Chain,
        block_numbers: &[BlockNum],
    ) -> Result<HashMap<BlockNum, u64>, surf::Error> {
        let mut load_balancer = self.load_balancer.lock().await;
        let url = load_balancer.get_endpoint(chain).unwrap();
        drop(load_balancer);

        let mut json_body = vec![];

        for (i, block_number) in block_numbers.iter().enumerate() {
            json_body.push(json!({
                "jsonrpc": "2.0",
                "method": "eth_getBlockByNumber",
                "params": [
                    format!("0x{:x}", block_number),
                    false
                ],
                "id": i
            }));
        }

        let delay = rand::random::<u64>() % 500;
        tokio::time::sleep(Duration::from_millis(delay)).await;

        let permit = PERMITS.acquire().await.unwrap();

        let mut res = self.client.post(url).body_json(&json!(json_body))?.await?;

        drop(permit);

        let body_str = res.body_string().await?;

        let body: Value = serde_json::from_str(&body_str).unwrap();

        let mut timestamps = HashMap::new();

        for result in body.as_array().unwrap() {
            let result = &result["result"];

            let block_num = u64::from_str_radix(
                result["number"].as_str().unwrap().trim_start_matches("0x"),
                16,
            )
            .unwrap();

            let timestamp = u64::from_str_radix(
                result["timestamp"]
                    .as_str()
                    .unwrap()
                    .trim_start_matches("0x"),
                16,
            )
            .unwrap();

            timestamps.insert(block_num, timestamp);
        }

        Ok(timestamps)
    }

    pub async fn get_block_timestamp(
        &self,
        chain: Chain,
        block_number: BlockNum,
    ) -> Result<u64, surf::Error> {
        let mut load_balancer = self.load_balancer.lock().await;
        let url = load_balancer.get_endpoint(chain).unwrap();
        drop(load_balancer);

        let json_body = json!({
            "jsonrpc": "2.0",
            "method": "eth_getBlockByNumber",
            "params": [
                format!("0x{:x}", block_number),
                false
            ],
            "id": 1
        });

        let permit = PERMITS.acquire().await.unwrap();

        let mut res = self.client.post(url).body_json(&json!(json_body))?.await?;

        drop(permit);

        let body_str = res.body_string().await?;

        let body: Value = serde_json::from_str(&body_str).unwrap();

        Ok(u64::from_str_radix(
            body["result"]["timestamp"]
                .as_str()
                .unwrap()
                .trim_start_matches("0x"),
            16,
        )
        .unwrap())
    }

    pub async fn eth_call(
        &self,
        chain: Chain,
        contract_address: &str,
        func_selector: &str,
        args: &[u8],
        block_number: BlockNum,
    ) -> Result<Value, surf::Error> {
        let mut load_balancer = self.load_balancer.lock().await;
        let url = load_balancer.get_endpoint(chain).unwrap();
        drop(load_balancer);

        let json_body = json!({
            "jsonrpc": "2.0",
            "method": "eth_call",
            "params": [
                {
                    "to": contract_address,
                    "data": format!("0x{}{}", func_selector, hex::encode(args))
                },
                format!("0x{:x}", block_number)
            ],
            "id": 1
        });

        let permit = PERMITS.acquire().await.unwrap();

        let mut res = self.client.post(url).body_json(&json!(json_body))?.await?;

        drop(permit);

        let body_str = res.body_string().await?;

        Ok(serde_json::from_str(&body_str).unwrap())
    }
}
