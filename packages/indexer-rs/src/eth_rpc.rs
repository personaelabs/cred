use serde_json::{json, Value};
use std::env;
use std::env::VarError;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::sync::Semaphore;

const NUM_MAINNET_NODES: u32 = 10;

#[derive(Debug, Copy, Clone)]
pub enum Chain {
    Mainnet,
    Optimism,
    Base,
    Arbitrum,
}

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
        let api_key = match chain {
            Chain::Mainnet => env::var(format!("ALCHEMY_API_KEY_{}", self.next_client_index))?,
            Chain::Optimism => env::var("ALCHEMY_OPT_API_KEY")?,
            Chain::Base => env::var("ALCHEMY_BASE_API_KEY")?,
            Chain::Arbitrum => env::var("ALCHEMY_ARB_API_KEY")?,
        };

        let subdomain = match chain {
            Chain::Mainnet => "eth-mainnet",
            Chain::Optimism => "opt-mainnet",
            Chain::Base => "base-mainnet",
            Chain::Arbitrum => "arb-mainnet",
        };

        let url = format!("https://{}.g.alchemy.com/v2/{}", subdomain, api_key);

        self.next_client_index = (self.next_client_index + 1) % NUM_MAINNET_NODES;
        Ok(url)
    }
}

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

    pub async fn get_block_number(
        &self,
        semaphore: &Semaphore,
        chain: Chain,
    ) -> Result<u64, surf::Error> {
        let url = self
            .load_balancer
            .lock()
            .unwrap()
            .get_endpoint(chain)
            .unwrap();

        let permit = semaphore.acquire().await.unwrap();
        let delay = rand::random::<u64>() % 500;
        tokio::time::sleep(Duration::from_millis(delay)).await;

        let mut res = self
            .client
            .post(url)
            .body_json(&json!({
                "jsonrpc": "2.0",
                "method": "eth_blockNumber",
                "params": [],
                "id": 0,
            }))?
            .await?;

        let body_str = res.body_string().await?;

        let body: Value = serde_json::from_str(&body_str).unwrap();

        drop(permit);

        Ok(u64::from_str_radix(
            body["result"].as_str().unwrap().trim_start_matches("0x"),
            16,
        )
        .unwrap())
    }

    pub async fn get_logs_batch(
        &self,
        semaphore: &Semaphore,
        chain: Chain,
        address: &str,
        event_signature: &str,
        batch_options: &[[u64; 2]],
    ) -> Result<Value, surf::Error> {
        let url = self
            .load_balancer
            .lock()
            .unwrap()
            .get_endpoint(chain)
            .unwrap();

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

        let permit = semaphore.acquire().await.unwrap();

        let delay = rand::random::<u64>() % 500;
        tokio::time::sleep(Duration::from_millis(delay)).await;

        let mut res = self.client.post(url).body_json(&json!(json_body))?.await?;

        drop(permit);

        let body_str = res.body_string().await?;

        Ok(serde_json::from_str(&body_str).unwrap())

        // Parse the response
        //        result.json().await
    }
}
