use crate::{
    contract::Contract,
    eth_rpc::EthRpcClient,
    processors::{upsert_group, GroupIndexer},
    rocksdb_key::{RocksDbKey, ERC721_TRANSFER_EVENT_ID},
    tree::save_tree,
    utils::{decode_erc721_transfer_event, is_event_logs_ready},
    Address, GroupType,
};
use std::{collections::HashSet, sync::Arc};

pub struct AllHoldersIndexer {
    pub unique_holders: HashSet<Address>,
    pub contract: Contract,
    pub group_id: Option<i32>,
    pub pg_client: Arc<tokio_postgres::Client>,
    pub rocksdb_client: Arc<rocksdb::DB>,
    pub eth_client: Arc<EthRpcClient>,
}

impl AllHoldersIndexer {
    pub fn new(
        contract: Contract,
        pg_client: Arc<tokio_postgres::Client>,
        rocksdb_client: Arc<rocksdb::DB>,
        eth_client: Arc<EthRpcClient>,
    ) -> Self {
        AllHoldersIndexer {
            unique_holders: HashSet::new(),
            contract,
            group_id: None,
            pg_client,
            rocksdb_client,
            eth_client,
        }
    }
}

#[async_trait::async_trait]
impl GroupIndexer for AllHoldersIndexer {
    fn group_handle(&self) -> String {
        format!("{}-all-holders", self.contract.name.to_lowercase())
    }

    fn display_name(&self) -> String {
        format!("{} historical holder", self.contract.name.clone())
    }

    fn process_log(&mut self, _key: RocksDbKey, log: &[u8]) -> Result<(), std::io::Error> {
        let log = decode_erc721_transfer_event(log);
        self.unique_holders.insert(log.to);
        Ok(())
    }

    async fn is_ready(&self) -> Result<bool, surf::Error> {
        is_event_logs_ready(
            &self.rocksdb_client,
            &self.eth_client,
            ERC721_TRANSFER_EVENT_ID,
            &self.contract,
        )
        .await
    }

    async fn init_group(&mut self) -> Result<(), tokio_postgres::Error> {
        let handle = self.group_handle();
        let display_name = self.display_name();

        let group_id = upsert_group(
            &self.pg_client,
            &display_name,
            &handle,
            GroupType::AllHolders,
        )
        .await?;
        self.group_id = Some(group_id);

        Ok(())
    }

    async fn save_tree(&self, block_number: i64) -> Result<(), tokio_postgres::Error> {
        if let Some(group_id) = self.group_id {
            save_tree(
                group_id,
                GroupType::AllHolders,
                &self.pg_client,
                self.unique_holders.clone().into_iter().collect(),
                block_number,
            )
            .await?;
        } else {
            panic!("Group ID not set");
        }

        Ok(())
    }
}
