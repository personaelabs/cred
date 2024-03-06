use reqwest::{Client, Error};
use serde_json::{json, Value};
use std::env;
use std::env::VarError;

const NUM_NODES: u32 = 10;

#[derive(Debug, Copy, Clone)]
pub enum Chain {
    Mainnet,
    Optimism,
    Base,
    Arbitrum,
}

/**
 * A factory for creating Ethereum RPC clients.
 * It spawns RPC clients to distribute requests across multiple Alchemy nodes.
 */
pub struct EthClientFactory {
    active_clients: Vec<u32>,
}

impl Default for EthClientFactory {
    fn default() -> Self {
        Self::new()
    }
}

impl EthClientFactory {
    pub fn new() -> Self {
        Self {
            active_clients: Vec::new(),
        }
    }

    pub fn create(&mut self, chain: Chain) -> Result<EthRpcClient, VarError> {
        let next_client_index = self.active_clients.len() as u32 % NUM_NODES;

        let api_key = match chain {
            Chain::Mainnet => env::var(format!("ALCHEMY_API_KEY_{}", next_client_index))?,
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
        println!("url: {}", url);
        //        self.active_clients.push(next_client_index);

        Ok(EthRpcClient {
            id: next_client_index,
            url,
        })
    }
}

pub struct EthRpcClient {
    id: u32,
    url: String,
}

impl EthRpcClient {
    pub async fn get_block_number(&self) -> Result<u64, Error> {
        let client = Client::new();

        let response = client
            .post(&self.url)
            .json(&json!({
                "jsonrpc": "2.0",
                "method": "eth_blockNumber",
                "params": [],
                "id": 1,
            }))
            .send()
            .await?;

        let response_json: serde_json::Value = response.json().await?;

        Ok(u64::from_str_radix(
            response_json["result"]
                .as_str()
                .unwrap()
                .trim_start_matches("0x"),
            16,
        )
        .unwrap())
    }

    pub async fn get_logs(
        &self,
        address: &str,
        event_signature: &str,
        from_block: u64,
        to_block: u64,
    ) -> Result<Value, Error> {
        let client = Client::new();

        let json_body = json!({
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
            "id":1
        });

        let response = client
            .post(&self.url)
            .json(&json!(json_body))
            .send()
            .await?;

        // Parse the response
        response.json().await
    }

    pub async fn get_logs_batch(
        &self,
        address: &str,
        event_signature: &str,
        batch_options: &[[u64; 2]],
    ) -> Result<Value, Error> {
        let client = Client::new();

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
                "id": i + 1,
            }));
        }

        let result = client
            .post(&self.url)
            .json(&json!(json_body))
            .send()
            .await?;

        // Parse the response
        result.json().await
    }
}
