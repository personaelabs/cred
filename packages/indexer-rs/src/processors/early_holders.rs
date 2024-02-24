use crate::prisma;
use crate::tree::save_tree;
use crate::TransferEvent;
use prisma::contract;
use prisma::PrismaClient;
use prisma_client_rust::QueryError;
use std::collections::HashSet;

use super::ProcessorLike;

pub fn get_early_holder_handle(contract: &contract::Data) -> String {
    format!("early-holder-{}", contract.name.to_lowercase())
}

pub struct EarlyHolderIndexer {
    pub unique_holders: HashSet<[u8; 20]>,
    pub early_holders: HashSet<[u8; 20]>,
    contract: contract::Data,
}

impl EarlyHolderIndexer {
    pub fn new(contract: contract::Data) -> Self {
        EarlyHolderIndexer {
            unique_holders: HashSet::new(),
            early_holders: HashSet::new(),
            contract,
        }
    }
}

impl ProcessorLike for EarlyHolderIndexer {
    fn group_handle(&self) -> String {
        get_early_holder_handle(&self.contract)
    }

    fn process_log(&mut self, log: &TransferEvent) -> Result<(), std::io::Error> {
        self.unique_holders.insert(log.to);

        Ok(())
    }

    async fn index_tree(
        &self,
        prisma_client: &PrismaClient,
        block_number: u64,
    ) -> Result<(), QueryError> {
        let total_holders = self.unique_holders.len();

        // Get the first 5% of the holders
        let earliness_threshold = total_holders / 20;

        let early_holders = self
            .unique_holders
            .iter()
            .take(earliness_threshold)
            .copied()
            .collect();

        let group = self.get_group(prisma_client).await?;
        let group_id = group.id;

        save_tree(prisma_client, group_id, early_holders, block_number).await?;

        Ok(())
    }
}
