use crate::{
    coingecko::CoingeckoClient,
    contract::Contract,
    contract_event_iterator::ContractEventIterator,
    eth_rpc::Chain,
    group::Group,
    processors::{GroupIndexer, IndexerResources},
    rocksdb_key::{KeyType, RocksDbKey, ERC20_TRANSFER_EVENT_ID},
    utils::{decode_erc20_transfer_event, get_chain_id, is_event_logs_ready, MINTER_ADDRESS},
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

    /// Get the hourly token prices from Coingecko
    async fn get_token_prices(&self) -> HashMap<u64, f64> {
        let mut token_prices = HashMap::new();

        // Get the timestamp to price mapping from Coingecko
        let timestamp_to_price = self
            .coingecko_client
            .get_hourly_market_chart(self.chain(), &self.contract().address)
            .await
            .unwrap();

        for (timestamp, price) in timestamp_to_price.iter() {
            token_prices.insert(*timestamp, *price);
        }

        token_prices
    }

    fn get_block_timestamp(&self, block_num: BlockNum) -> Result<u64, Error> {
        let key = RocksDbKey {
            key_type: KeyType::BlockTimestamp,
            event_id: None,
            contract_id: None,
            block_num: Some(block_num),
            log_index: None,
            tx_index: None,
            chunk_num: None,
            chain_id: Some(get_chain_id(self.contract().chain)),
        };

        let value = self.resources.rocksdb_client.get(key.to_bytes()).unwrap();

        match value {
            Some(value) => {
                let timestamp = u64::from_be_bytes(value.try_into().unwrap());
                Ok(timestamp)
            }
            None => Err(Error::Std(std::io::Error::new(
                ErrorKind::Other,
                "Block timestamp not found",
            ))),
        }
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

        // Get the timestamp to price mapping from Coingecko
        let timestamp_to_price = self.get_token_prices().await;

        // Holds the balances of all addresses
        let mut balances = HashMap::new();

        // Holds the total purchase amount in USD purchased by each address.
        // If an address has more than one purchase,
        // the total purchase amount is the sum of all purchases where each purchase price is
        // determined individually by the price at the block timestamp.
        let mut total_purchase_usd = HashMap::new();

        let mut believers = HashSet::new();

        for (key, value) in iterator {
            let log = decode_erc20_transfer_event(&value);

            // ---------------------------------
            // 1. Update the `balances` mapping
            // ---------------------------------

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

            // ---------------------------------
            // 2. Update the `total_purchase_usd` mapping
            // ---------------------------------

            // Find the timestamp of the block number
            let timestamp = self.get_block_timestamp(key.block_num.unwrap())?;

            let mut sorted_timestamps = timestamp_to_price.keys().copied().collect::<Vec<u64>>();
            sorted_timestamps.sort();

            // Find the closest timestamp in the (timestamp -> price) mapping that is greater than or equal to the block number's timestamp
            let closest_timestamp = sorted_timestamps
                .iter()
                .find(|&&t| t >= timestamp)
                .unwrap_or(sorted_timestamps.last().unwrap());

            let price = timestamp_to_price.get(closest_timestamp).unwrap();

            // Calculate the USD amount of this transfer
            let purchase_amount = log.value.clone();
            let purchase_amount = purchase_amount / BigUint::from(10u8).pow(18u32);
            let purchase_amount = purchase_amount.to_f64().unwrap();
            let transfer_usd_amount = price * purchase_amount;

            // Add the USD amount of this transfer to the total purchase amount of the `to` address
            let total_purchase =
                total_purchase_usd.get(&log.to).unwrap_or(&0f64) + transfer_usd_amount;
            total_purchase_usd.insert(log.to, total_purchase);
        }

        // Add the addresses that have a non-zero balance
        // and have purchased more than $50 worth of the token
        for (address, total_purchase) in total_purchase_usd {
            let current_balance = balances.get(&address).unwrap();
            if *current_balance != BigUint::from(0u32) && total_purchase > 50f64 {
                believers.insert(address);
            }
        }

        info!("Found {:?} believers", believers.len());

        Ok(believers)
    }
}
