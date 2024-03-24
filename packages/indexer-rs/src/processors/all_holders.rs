use super::IndexerResources;
use crate::{
    contract::{Contract, ContractType},
    contract_event_iterator::ContractEventIterator,
    eth_rpc::Chain,
    processors::GroupIndexer,
    rocksdb_key::{ERC1155_TRANSFER_SINGLE_EVENT_ID, ERC721_TRANSFER_EVENT_ID},
    utils::{
        decode_erc1155_transfer_batch_event, decode_erc1155_transfer_single_event,
        decode_erc721_transfer_event, is_event_logs_ready,
    },
    Address, BlockNum,
};
use std::{collections::HashSet, io::Error};

pub struct AllHoldersIndexer {
    pub contract: Contract,
    pub group_id: i32,
    pub resources: IndexerResources,
}

impl AllHoldersIndexer {
    pub fn new(contract: Contract, group_id: i32, resources: IndexerResources) -> Self {
        AllHoldersIndexer {
            contract,
            group_id,
            resources,
        }
    }

    // Get all members by iterating over ERC721 transfer events
    fn get_members_as_erc721(&self, block_number: BlockNum) -> Result<HashSet<Address>, Error> {
        let iterator = ContractEventIterator::new(
            &self.resources.rocksdb_client,
            ERC721_TRANSFER_EVENT_ID,
            self.contract.id,
            Some(block_number),
        );

        let mut unique_holders = HashSet::new();
        for (_, value) in iterator {
            let log = decode_erc721_transfer_event(&value);
            unique_holders.insert(log.to);
        }

        Ok(unique_holders)
    }

    // Get all members by iterating over ERC1155 transfer events
    fn get_members_as_erc1155(&self, block_number: BlockNum) -> Result<HashSet<Address>, Error> {
        let transfer_single_iterator = ContractEventIterator::new(
            &self.resources.rocksdb_client,
            ERC1155_TRANSFER_SINGLE_EVENT_ID,
            self.contract.id,
            Some(block_number),
        );

        let mut unique_holders = HashSet::new();

        for (_, value) in transfer_single_iterator {
            let log = decode_erc1155_transfer_single_event(&value);
            unique_holders.insert(log.to);
        }

        let transfer_batch_iterator = ContractEventIterator::new(
            &self.resources.rocksdb_client,
            ERC1155_TRANSFER_SINGLE_EVENT_ID,
            self.contract.id,
            Some(block_number),
        );

        for (_, value) in transfer_batch_iterator {
            let log = decode_erc1155_transfer_batch_event(&value);
            unique_holders.insert(log.to);
        }

        Ok(unique_holders)
    }
}

#[async_trait::async_trait]
impl GroupIndexer for AllHoldersIndexer {
    fn group_id(&self) -> i32 {
        self.group_id
    }

    fn chain(&self) -> Chain {
        self.contract.chain
    }

    fn get_members(&self, block_number: BlockNum) -> Result<HashSet<Address>, Error> {
        let unique_holders = match self.contract.contract_type {
            ContractType::ERC721 => self.get_members_as_erc721(block_number)?,
            ContractType::ERC1155 => self.get_members_as_erc1155(block_number)?,
            _ => panic!("AllHoldersIndexer: Unsupported contract type"),
        };

        Ok(unique_holders)
    }

    async fn is_ready(&self) -> Result<bool, surf::Error> {
        if self.contract.contract_type == ContractType::ERC721
            || self.contract.contract_type == ContractType::Punk
        {
            // Check if ERC721 transfer event logs are ready
            return is_event_logs_ready(
                &self.resources.rocksdb_client,
                &self.resources.eth_client,
                ERC721_TRANSFER_EVENT_ID,
                &self.contract,
            )
            .await;
        } else if self.contract.contract_type == ContractType::ERC1155 {
            // Check if both ERC1155 transfer single and transfer batch events are ready

            // Check if ERC1155 transfer single event logs are ready
            let is_transfer_single_logs_ready = is_event_logs_ready(
                &self.resources.rocksdb_client,
                &self.resources.eth_client,
                ERC1155_TRANSFER_SINGLE_EVENT_ID,
                &self.contract,
            )
            .await?;

            // Check if ERC1155 transfer batch event logs are ready
            let is_transfer_batch_logs_ready = is_event_logs_ready(
                &self.resources.rocksdb_client,
                &self.resources.eth_client,
                ERC1155_TRANSFER_SINGLE_EVENT_ID,
                &self.contract,
            )
            .await?;

            return Ok(is_transfer_single_logs_ready && is_transfer_batch_logs_ready);
        } else {
            panic!("AllHoldersIndexer: Unsupported contract type");
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::{
        eth_rpc::EthRpcClient,
        log_sync_engine::LogSyncEngine,
        postgres::init_postgres,
        test_utils::{delete_all, erc1155_test_contract, erc721_test_contract},
        utils::dotenv_config,
        ROCKSDB_PATH,
    };
    use rocksdb::{Options, DB};
    use std::sync::Arc;

    #[tokio::test]
    async fn test_all_holders_erc721_get_members() {
        dotenv_config();

        // Use a different path for the test db to avoid conflicts with the main db
        const TEST_ROCKSDB_PATH: &str = "test_all_holders_erc721_get_members";

        let mut rocksdb_options = Options::default();
        rocksdb_options.create_if_missing(true);

        let db = Arc::new(
            DB::open(
                &rocksdb_options,
                format!("{}/{}", ROCKSDB_PATH, TEST_ROCKSDB_PATH),
            )
            .unwrap(),
        );

        // Delete all records from the test db
        delete_all(&db);

        let pg_client = init_postgres().await;

        let contract = erc721_test_contract();

        // Hardcoded to the latest block number at the time of writing this test,
        // so we can hardcode other values as well.
        let to_block = 19473397;

        let eth_client = Arc::new(EthRpcClient::new());

        let contract_sync_engine = LogSyncEngine::new(
            eth_client.clone(),
            contract.clone(),
            ERC721_TRANSFER_EVENT_ID,
            db.clone(),
        );
        contract_sync_engine.sync_to_block(to_block).await;

        let resources = IndexerResources {
            pg_client: pg_client.clone(),
            rocksdb_client: db.clone(),
            eth_client: eth_client.clone(),
        };

        let group_id = 1;
        let indexer = AllHoldersIndexer::new(contract.clone(), group_id, resources);

        let expected_num_members = 203;
        let members = indexer.get_members(to_block).unwrap();

        // Check that all unique holders were indexed
        assert_eq!(members.len(), expected_num_members);
    }

    #[tokio::test]
    async fn test_all_holders_erc1155_get_members() {
        dotenv_config();

        // Use a different path for the test db to avoid conflicts with the main db
        const TEST_ROCKSDB_PATH: &str = "test_all_holders_indexer";

        let mut rocksdb_options = Options::default();
        rocksdb_options.create_if_missing(true);

        let db = Arc::new(
            DB::open(
                &rocksdb_options,
                format!("{}/{}", ROCKSDB_PATH, TEST_ROCKSDB_PATH),
            )
            .unwrap(),
        );

        // Delete all records from the test db
        delete_all(&db);

        let pg_client = init_postgres().await;

        let contract = erc1155_test_contract();

        // Hardcoded to the latest block number at the time of writing this test,
        // so we can hardcode other values as well.
        let to_block = 12256476;

        let eth_client = Arc::new(EthRpcClient::new());

        let transfer_single_sync_engine = LogSyncEngine::new(
            eth_client.clone(),
            contract.clone(),
            ERC1155_TRANSFER_SINGLE_EVENT_ID,
            db.clone(),
        );
        transfer_single_sync_engine.sync_to_block(to_block).await;

        let transfer_batch_sync_engine = LogSyncEngine::new(
            eth_client.clone(),
            contract.clone(),
            ERC1155_TRANSFER_SINGLE_EVENT_ID,
            db.clone(),
        );

        transfer_batch_sync_engine.sync_to_block(to_block).await;

        let resources = IndexerResources {
            pg_client: pg_client.clone(),
            rocksdb_client: db.clone(),
            eth_client: eth_client.clone(),
        };

        let group_id = 1;
        let indexer = AllHoldersIndexer::new(contract.clone(), group_id, resources);

        let expected_num_members = 411;
        let members = indexer.get_members(to_block).unwrap();

        // Check that all unique holders were indexed
        assert_eq!(members.len(), expected_num_members);
    }
}
