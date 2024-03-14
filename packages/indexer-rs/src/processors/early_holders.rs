use crate::{
    contract::Contract,
    eth_rpc::EthRpcClient,
    processors::{upsert_group, GroupIndexer},
    rocksdb_key::ERC20_TRANSFER_EVENT_ID,
    tree::save_tree,
    utils::{decode_erc20_transfer_event, is_event_logs_ready},
    GroupType,
};
use std::{collections::HashSet, sync::Arc};

pub struct EarlyHolderIndexer {
    pub unique_holders: HashSet<[u8; 20]>,
    pub ordered_holders: Vec<[u8; 20]>,
    pub contract: Contract,
    pub group_id: Option<i32>,
    pub pg_client: Arc<tokio_postgres::Client>,
    pub rocksdb_client: Arc<rocksdb::DB>,
    pub eth_client: Arc<EthRpcClient>,
}

impl EarlyHolderIndexer {
    pub fn new(
        contract: Contract,
        pg_client: Arc<tokio_postgres::Client>,
        rocksdb_client: Arc<rocksdb::DB>,
        eth_client: Arc<EthRpcClient>,
    ) -> Self {
        EarlyHolderIndexer {
            unique_holders: HashSet::new(),
            ordered_holders: Vec::new(),
            contract,
            group_id: None,
            pg_client,
            rocksdb_client,
            eth_client,
        }
    }
}

#[async_trait::async_trait]
impl GroupIndexer for EarlyHolderIndexer {
    fn group_name(&self) -> String {
        "Early holder".to_string()
    }

    fn process_log(&mut self, log: &[u8]) -> Result<(), std::io::Error> {
        let log = decode_erc20_transfer_event(log);

        if !self.unique_holders.contains(&log.to) {
            self.unique_holders.insert(log.to);
            self.ordered_holders.push(log.to);
        }

        Ok(())
    }

    async fn is_ready(&self) -> Result<bool, surf::Error> {
        is_event_logs_ready(
            &self.rocksdb_client,
            &self.eth_client,
            ERC20_TRANSFER_EVENT_ID,
            &self.contract,
        )
        .await
    }

    async fn init_group(&mut self) -> Result<(), tokio_postgres::Error> {
        let handle = format!("early-holder-{}", self.contract.name.to_lowercase());
        let display_name = format!(
            "Early ${} holder",
            self.contract.symbol.clone().to_uppercase()
        );

        let group_id =
            upsert_group(&self.pg_client, &display_name, &handle, "early-holder").await?;
        self.group_id = Some(group_id);

        Ok(())
    }

    async fn save_tree(&self, block_number: i64) -> Result<(), tokio_postgres::Error> {
        let total_holders = self.unique_holders.len();

        // Get the first 5% of the holders
        let earliness_threshold = total_holders / 20;

        let early_holders = self
            .ordered_holders
            .iter()
            .take(earliness_threshold)
            .copied()
            .collect();

        if let Some(group_id) = self.group_id {
            save_tree(
                group_id,
                GroupType::Onchain,
                &self.pg_client,
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
