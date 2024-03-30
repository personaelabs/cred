use crate::contract_event_iterator::ContractEventIterator;
use crate::eth_rpc::{Chain, EthRpcClient};
use crate::rocksdb_key::{KeyType, RocksDbKey};
use crate::utils::get_chain_id;
use crate::{BlockNum, ContractId, EventId};
use log::{error, info};
use rocksdb::WriteBatch;
use std::collections::HashSet;
use std::sync::Arc;

/// A struct to sync all logs of a particular contract event
pub struct BlockTimestampSyncEngine {
    eth_client: Arc<EthRpcClient>,
    rocksdb_client: Arc<rocksdb::DB>,
    chain: Chain,
    event_id: EventId,
    contract_id: ContractId,
}

impl BlockTimestampSyncEngine {
    pub fn new(
        eth_client: Arc<EthRpcClient>,
        rocksdb_client: Arc<rocksdb::DB>,
        chain: Chain,
        event_id: EventId,
        contract_id: ContractId,
    ) -> Self {
        Self {
            eth_client,
            rocksdb_client,
            chain,
            event_id,
            contract_id,
        }
    }

    fn block_num_synched(&self, block_num: BlockNum) -> bool {
        let key = RocksDbKey {
            key_type: KeyType::BlockTimestamp,
            event_id: None,
            contract_id: None,
            block_num: Some(block_num),
            log_index: None,
            tx_index: None,
            chunk_num: None,
            chain_id: Some(get_chain_id(self.chain)),
        };

        self.rocksdb_client.get(key.to_bytes()).unwrap().is_some()
    }

    pub async fn sync(&self) {
        let event_log_iterator =
            ContractEventIterator::new(&self.rocksdb_client, self.event_id, self.contract_id, None);

        let mut block_nums = HashSet::new();

        for (key, _) in event_log_iterator {
            let block_num = key.block_num.unwrap();

            if self.block_num_synched(block_num) {
                // Skip if block timestamp already synched
                continue;
            }

            block_nums.insert(block_num);
        }

        for block_nums in block_nums
            .iter()
            .copied()
            .collect::<Vec<BlockNum>>()
            .chunks(1000)
        {
            info!("Syncing block timestamps for {} blocks", block_nums.len());

            let result = self
                .eth_client
                .get_block_timestamp_batch(
                    self.chain,
                    &block_nums.iter().copied().collect::<Vec<BlockNum>>(),
                )
                .await;

            if result.is_err() {
                error!("Failed to get block timestamps");
                continue;
            }

            let block_timestamps = result.unwrap();

            let mut batch = WriteBatch::default();
            for (block_num, timestamp) in block_timestamps {
                let key = RocksDbKey {
                    key_type: KeyType::BlockTimestamp,
                    event_id: None,
                    contract_id: None,
                    block_num: Some(block_num),
                    log_index: None,
                    tx_index: None,
                    chunk_num: None,
                    chain_id: Some(get_chain_id(self.chain)),
                };

                batch.put(key.to_bytes(), timestamp.to_be_bytes());
            }

            self.rocksdb_client.write(batch).unwrap();
        }
    }
}
