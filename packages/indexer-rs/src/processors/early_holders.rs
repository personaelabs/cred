use crate::{
    contract::Contract,
    processors::{upsert_group, GroupIndexer},
    tree::save_tree,
    TransferEvent,
};
use std::{collections::HashSet, sync::Arc};

pub struct EarlyHolderIndexer {
    pub unique_holders: HashSet<[u8; 20]>,
    pub early_holders: HashSet<[u8; 20]>,
    pub contract: Contract,
    pub group_id: Option<i32>,
    pub pg_client: Arc<tokio_postgres::Client>,
    pub rocksdb_client: Arc<rocksdb::DB>,
}

impl EarlyHolderIndexer {
    pub fn new(
        contract: Contract,
        pg_client: Arc<tokio_postgres::Client>,
        rocksdb_client: Arc<rocksdb::DB>,
    ) -> Self {
        EarlyHolderIndexer {
            unique_holders: HashSet::new(),
            early_holders: HashSet::new(),
            contract,
            group_id: None,
            pg_client,
            rocksdb_client,
        }
    }
}

impl GroupIndexer for EarlyHolderIndexer {
    fn process_log(&mut self, log: &TransferEvent) -> Result<(), std::io::Error> {
        self.unique_holders.insert(log.to);

        Ok(())
    }

    async fn init_group(&mut self) -> Result<(), tokio_postgres::Error> {
        let handle = format!("early-holder-{}", self.contract.name.to_lowercase());
        let display_name = format!(
            "Early {} holder",
            self.contract.symbol.clone().to_uppercase()
        );

        let group_id = upsert_group(&self.pg_client, &display_name, &handle).await?;
        self.group_id = Some(group_id);

        Ok(())
    }

    async fn save_tree(&self, block_number: i64) -> Result<(), tokio_postgres::Error> {
        let total_holders = self.unique_holders.len();

        // Get the first 5% of the holders
        let earliness_threshold = total_holders / 20;

        let early_holders = self
            .unique_holders
            .iter()
            .take(earliness_threshold)
            .copied()
            .collect();

        if let Some(group_id) = self.group_id {
            save_tree(
                group_id,
                self.pg_client.clone(),
                early_holders,
                block_number,
            )
            .await?;
        } else {
            panic!("Group ID not set");
        }

        Ok(())
    }
}
