use crate::{
    coingecko::CoingeckoClient,
    contract::Contract,
    contract_event_iterator::ContractEventIterator,
    eth_rpc::Chain,
    group::Group,
    processors::{GroupIndexer, IndexerResources},
    rocksdb_key::ERC20_TRANSFER_EVENT_ID,
    utils::{decode_erc20_transfer_event, is_event_logs_ready, MINTER_ADDRESS},
    Address, BlockNum, Error,
};
use log::info;
use num_bigint::BigUint;
use num_traits::ToPrimitive;
use std::{
    collections::{HashMap, HashSet},
    io::ErrorKind,
    sync::Arc,
};

pub struct BelieverIndexer {
    pub group: Group,
    pub resources: IndexerResources,
    pub coingecko_client: Arc<CoingeckoClient>,
}

impl BelieverIndexer {
    pub fn new(group: Group, resources: IndexerResources) -> Self {
        BelieverIndexer {
            group,
            resources,
            coingecko_client: Arc::new(CoingeckoClient::new()),
        }
    }

    fn contract(&self) -> &Contract {
        &self.group.contract_inputs[0]
    }

    /// Get the block number to timestamp mapping for
    /// all the blocks that have the contract's ERC20 transfer events
    async fn get_block_timestamp(&self) -> Result<HashMap<BlockNum, u64>, Error> {
        let iterator = ContractEventIterator::new(
            &self.resources.rocksdb_client,
            ERC20_TRANSFER_EVENT_ID,
            self.contract().id,
            None,
        );

        let unique_block_numbers = iterator
            .map(|(key, _)| key.block_num.unwrap())
            .collect::<HashSet<BlockNum>>()
            .iter()
            .copied()
            .collect::<Vec<BlockNum>>();

        println!("Unique block numbers: {:?}", unique_block_numbers.len());

        let mut block_num_to_timestamp = HashMap::new();

        // Map block number to timestamp
        for block_numbers in unique_block_numbers.chunks(1000) {
            let result = self
                .resources
                .eth_client
                .get_block_timestamp_batch(self.chain(), block_numbers)
                .await?;

            for (block_num, timestamp) in result {
                block_num_to_timestamp.insert(block_num, timestamp);
            }
        }

        Ok(block_num_to_timestamp)
    }

    /// Get the daily token prices from Coingecko
    async fn get_token_prices(&self) -> HashMap<u64, f64> {
        let mut token_prices = HashMap::new();

        // Get the timestamp to price mapping from Coingecko
        let timestamp_to_price = self
            .coingecko_client
            .get_daily_market_chart(self.chain(), &self.contract().address)
            .await
            .unwrap();

        for (timestamp, price) in timestamp_to_price.iter() {
            token_prices.insert(*timestamp, *price);
        }

        token_prices
    }
}

#[async_trait::async_trait]
impl GroupIndexer for BelieverIndexer {
    fn group(&self) -> &Group {
        &self.group
    }

    fn chain(&self) -> Chain {
        self.contract().chain
    }

    async fn is_ready(&self) -> Result<bool, surf::Error> {
        is_event_logs_ready(
            &self.resources.rocksdb_client,
            &self.resources.eth_client,
            ERC20_TRANSFER_EVENT_ID,
            self.contract(),
        )
        .await
    }

    async fn get_members(&self, block_number: BlockNum) -> Result<HashSet<Address>, Error> {
        let iterator = ContractEventIterator::new(
            &self.resources.rocksdb_client,
            ERC20_TRANSFER_EVENT_ID,
            self.contract().id,
            Some(block_number),
        );

        let timestamp_to_price = self.get_token_prices().await;

        let mut balances = HashMap::new();
        let mut total_purchase_usd = HashMap::new();
        let mut believers = HashSet::new();

        // Get the block number to timestamp mapping
        info!("Getting block number to timestamp mapping");
        let start = std::time::Instant::now();
        let block_num_to_timestamp = self.get_block_timestamp().await?;
        info!("Time taken: {:?}", start.elapsed());

        for (key, value) in iterator {
            let log = decode_erc20_transfer_event(&value);

            if log.value == BigUint::from(0u8) {
                continue;
            }

            if balances.get(&log.to).is_none() {
                // Initialize the balance of `to` to `value`
                balances.insert(log.to, log.value.clone());
            } else {
                // Increase balance of `to` by `value`
                let balance = balances.get_mut(&log.to).unwrap();
                *balance += &log.value;
            }

            if log.from != MINTER_ADDRESS {
                if balances.get(&log.from).is_none() {
                    // Initialize the balance of `from` to 0
                    balances.insert(log.from, BigUint::from(0u8));
                }

                let balance = balances.get(&log.from).unwrap();
                if balance < &log.value {
                    return Err(Error::Std(std::io::Error::new(
                        ErrorKind::Other,
                        "Insufficient balance",
                    )));
                }

                // Decrease balance of `from` by `value`
                let balance = balances.get_mut(&log.from).unwrap();
                *balance -= &log.value;
            }

            // Find the timestamp of the block number
            let timestamp = block_num_to_timestamp.get(&key.block_num.unwrap()).unwrap();

            let mut sorted_timestamps = timestamp_to_price.keys().copied().collect::<Vec<u64>>();
            sorted_timestamps.sort();

            // Find the closest timestamp in the (timestamp -> price) mapping that is greater than or equal to the block number's timestamp
            let closest_timestamp = sorted_timestamps
                .iter()
                .find(|&&t| t >= *timestamp)
                .unwrap_or(sorted_timestamps.last().unwrap());

            // Get the price at the closest timestamp
            let price = timestamp_to_price.get(closest_timestamp).unwrap();

            // Calculate the USD amount of this transfer
            let purchase_amount = log.value.clone();
            let purchase_amount = purchase_amount / BigUint::from(10u8).pow(18u32);
            let purchase_amount = purchase_amount.to_f64().unwrap();
            let usd_amount = price * purchase_amount;

            // Add the USD amount of this transfer to the total purchase amount of the `to` address
            let total_purchase = total_purchase_usd.get(&log.to).unwrap_or(&0f64) + usd_amount;
            total_purchase_usd.insert(log.to, total_purchase);

            // Check if the USD amount is greater than $50
            if total_purchase > 50f64 {
                believers.insert(log.to);
            }
        }

        info!("Found {:?} believers", believers.len());

        Ok(believers)
    }
}
