use crate::tree::save_tree;
use crate::{contract::Contract, TransferEvent};
use num_bigint::BigUint;
use std::collections::{HashMap, HashSet};
use std::io::Error;
use std::io::ErrorKind;
use std::sync::Arc;

use super::{upsert_group, GroupIndexer};

const MINTER_ADDRESS: [u8; 20] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

pub fn get_whale_handle(contract_name: &str) -> String {
    format!("whale-{}", contract_name.to_lowercase())
}

pub struct WhaleIndexer {
    balances: HashMap<[u8; 20], BigUint>,
    total_supply: BigUint,
    whale_threshold: BigUint,
    pg_client: Arc<tokio_postgres::Client>,
    whales: HashSet<[u8; 20]>,
    contract: Contract,
    group_id: Option<i32>,
}

impl WhaleIndexer {
    pub fn new(contract: Contract, pg_client: Arc<tokio_postgres::Client>) -> Self {
        WhaleIndexer {
            balances: HashMap::new(),
            total_supply: BigUint::from(0u32),
            whale_threshold: BigUint::from(0u32),
            whales: HashSet::new(),
            pg_client,
            contract,
            group_id: None,
        }
    }
}

impl GroupIndexer for WhaleIndexer {
    async fn init_group(&mut self) -> Result<(), tokio_postgres::Error> {
        let handle = format!("whale-{}", self.contract.name.to_lowercase());
        let display_name = format!("{} whale", self.contract.symbol.clone().to_uppercase());

        let group_id = upsert_group(&self.pg_client, &display_name, &handle).await?;
        self.group_id = Some(group_id);

        Ok(())
    }

    fn process_log(&mut self, log: &TransferEvent) -> Result<(), Error> {
        if log.value == BigUint::from(0u8) {
            return Ok(());
        }

        if self.balances.get(&log.to).is_none() {
            // Initialize the balance of `to` to `value`
            self.balances.insert(log.to, log.value.clone());
        } else {
            // Increase balance of `to` by `value`
            let balance = self.balances.get_mut(&log.to).unwrap();
            *balance += &log.value;

            if *balance >= self.whale_threshold {
                self.whales.insert(log.to);
            }
        }

        if self.balances.get(&log.from).is_none() {
            // Initialize the balance of `from` to 0
            self.balances.insert(log.from, BigUint::from(0u8));
        }

        if log.from == MINTER_ADDRESS {
            // Increase total supply by `value`
            self.total_supply += &log.value;

            self.whale_threshold = self.total_supply.clone() / BigUint::from(1000u32);
        } else {
            let balance = self.balances.get(&log.from).unwrap();
            if balance < &log.value {
                return Err(Error::new(ErrorKind::Other, "Insufficient balance"));
            }

            // Decrease balance of `from` by `value`
            let balance = self.balances.get_mut(&log.from).unwrap();
            *balance -= &log.value;
        }

        if log.to == MINTER_ADDRESS {
            // Decrease total supply by `value`
            self.total_supply -= &log.value;

            self.whale_threshold = self.total_supply.clone() / BigUint::from(1000u32);
        };

        Ok(())
    }

    async fn save_tree(&self, block_number: i64) -> Result<(), tokio_postgres::Error> {
        if let Some(group_id) = self.group_id {
            save_tree(
                group_id,
                self.pg_client.clone(),
                self.whales.clone().into_iter().collect(),
                block_number,
            )
            .await?;
        } else {
            panic!("Group ID not set");
        }

        Ok(())
    }
}
