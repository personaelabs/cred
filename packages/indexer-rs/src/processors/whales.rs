use crate::prisma;
use crate::processors::ProcessorLike;
use crate::tree::save_tree;
use crate::TransferEvent;
use num_bigint::BigUint;
use prisma::contract;
use prisma::PrismaClient;
use prisma_client_rust::queries::QueryError;
use std::collections::{HashMap, HashSet};
use std::io::Error;
use std::io::ErrorKind;

const MINTER_ADDRESS: [u8; 20] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

pub fn get_whale_handle(contract: &contract::Data) -> String {
    format!("whale-{}", contract.name.to_lowercase())
}

pub struct WhaleIndexer {
    balances: HashMap<[u8; 20], BigUint>,
    total_supply: BigUint,
    whale_threshold: BigUint,
    whales: HashSet<[u8; 20]>,
    contract: contract::Data,
}

impl WhaleIndexer {
    pub fn new(contract: contract::Data) -> Self {
        WhaleIndexer {
            balances: HashMap::new(),
            total_supply: BigUint::from(0u32),
            whale_threshold: BigUint::from(0u32),
            whales: HashSet::new(),
            contract,
        }
    }
}

impl ProcessorLike for WhaleIndexer {
    fn group_handle(&self) -> String {
        get_whale_handle(&self.contract)
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

    async fn index_tree(
        &self,
        prisma_client: &PrismaClient,
        block_number: u64,
    ) -> Result<(), QueryError> {
        let group = self.get_group(prisma_client).await?;
        let group_id = group.id;
        save_tree(
            prisma_client,
            group_id,
            self.whales.clone().into_iter().collect(),
            block_number,
        )
        .await?;

        Ok(())
    }
}
