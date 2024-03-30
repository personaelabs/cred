use crate::eth_rpc::Chain;
use serde_json::Value;
use std::collections::HashMap;
use std::env;
use std::sync::Arc;

/// A client for interacting with the Ethereum JSON-RPC API
pub struct CoingeckoClient {
    client: Arc<surf::Client>,
    api_key: String,
}

impl Default for CoingeckoClient {
    fn default() -> Self {
        Self::new()
    }
}

impl CoingeckoClient {
    pub fn new() -> Self {
        let api_key = env::var("COINGECKO_API_KEY").unwrap();
        let client = surf::Client::new();

        Self {
            client: Arc::new(client),
            api_key,
        }
    }

    pub async fn get_daily_market_chart(
        &self,
        chain: Chain,
        contract_address: &str,
    ) -> Result<HashMap<u64, f64>, surf::Error> {
        let chain = match chain {
            Chain::Mainnet => "ethereum",
            Chain::Optimism => "optimism",
            Chain::Base => "base",
            Chain::Arbitrum => "arbitrum",
        };

        let url = format!(
            "https://pro-api.coingecko.com/api/v3/coins/{}/contract/{}/market_chart?x_cg_pro_api_key={}&vs_currency=usd&days=365",
            chain, contract_address, self.api_key
        );

        let mut response = self.client.get(url).await?;

        let json: Value = response.body_json().await?;

        let prices = json["prices"].as_array().unwrap();

        let prices = prices
            .iter()
            .map(|price| {
                // Convert timestamp from milliseconds to seconds
                let timestamp = price[0].as_u64().unwrap().checked_div(1000).unwrap();
                let price = price[1].as_f64().unwrap();

                (timestamp, price)
            })
            .collect::<HashMap<u64, f64>>();

        Ok(prices)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{eth_rpc::Chain, utils::dotenv_config};

    #[tokio::test]
    async fn test_get_market_chart() {
        dotenv_config();
        let client = CoingeckoClient::new();
        let chain = Chain::Base;
        let contract_address = "0x0578d8a44db98b23bf096a382e016e29a5ce0ffe";

        let prices = client
            .get_daily_market_chart(chain, contract_address)
            .await
            .unwrap();

        println!("{:?}", prices);
    }
}
