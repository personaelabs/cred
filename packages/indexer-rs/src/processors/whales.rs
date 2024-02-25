use crate::processors::ProcessorLike;
use crate::storage::{Contract, Storage};
use crate::tree::save_tree;
use crate::TransferEvent;
use num_bigint::BigUint;
use std::collections::{HashMap, HashSet};
use std::io::Error;
use std::io::ErrorKind;
use std::marker::PhantomData;

const MINTER_ADDRESS: [u8; 20] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

pub fn get_whale_handle(contract_name: &str) -> String {
    format!("whale-{}", contract_name.to_lowercase())
}

pub struct WhaleIndexer<S> {
    balances: HashMap<[u8; 20], BigUint>,
    total_supply: BigUint,
    whale_threshold: BigUint,
    whales: HashSet<[u8; 20]>,
    contract: Contract,
    _marker: PhantomData<S>,
}

impl<S: Storage> WhaleIndexer<S> {
    pub fn new(contract: Contract) -> Self {
        WhaleIndexer {
            balances: HashMap::new(),
            total_supply: BigUint::from(0u32),
            whale_threshold: BigUint::from(0u32),
            whales: HashSet::new(),
            contract,
            _marker: PhantomData,
        }
    }
}

impl<S: Storage> ProcessorLike<S> for WhaleIndexer<S> {
    fn group_handle(&self) -> String {
        get_whale_handle(&self.contract.name)
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

    async fn index_tree(&self, storage: &S, block_number: i64) -> Result<(), S::ErrorType> {
        let group = self.get_group(storage).await?;
        let group_id = group.id;
        save_tree(
            storage,
            group_id,
            self.whales.clone().into_iter().collect(),
            block_number,
        )
        .await?;

        Ok(())
    }
}
