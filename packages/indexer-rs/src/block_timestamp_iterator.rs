use crate::{
    eth_rpc::Chain,
    rocksdb_key::{KeyType, RocksDbKey},
    utils::get_chain_id,
    BlockNum, ChainId,
};
use rocksdb::{DBIteratorWithThreadMode, IteratorMode, ReadOptions, DB};

/// An iterator over the event logs for a contract.
/// It wraps the RocksDB iterator and filters the logs for a specific contract and event.
pub struct BlockTimestampIterator<'a> {
    chain_id: ChainId,
    to_block: Option<BlockNum>,
    inner: DBIteratorWithThreadMode<'a, DB>,
}

impl<'a> BlockTimestampIterator<'a> {
    pub fn new(db: &'a DB, chain: Chain, to_block: Option<BlockNum>) -> Self {
        // Initialize the RocksDB iterator that starts from the first log for `contract.id`
        let mut iterator_ops = ReadOptions::default();
        iterator_ops.set_async_io(true);

        let chain_id = get_chain_id(chain);
        let start_key = RocksDbKey::new_block_timestamp_start_key(chain_id);

        let iterator = db.iterator_opt(
            IteratorMode::From(&start_key.to_bytes(), rocksdb::Direction::Forward),
            iterator_ops,
        );

        Self {
            to_block,
            chain_id,
            inner: iterator,
        }
    }
}

impl Iterator for BlockTimestampIterator<'_> {
    type Item = (RocksDbKey, u64);

    fn next(&mut self) -> Option<Self::Item> {
        let item = self.inner.next();

        if let Some(item) = item {
            let (key, value) = item.unwrap();
            let key = RocksDbKey::from_bytes(key.as_ref().try_into().unwrap());

            if key.key_type == KeyType::BlockTimestamp && key.chain_id.unwrap() == self.chain_id {
                if let Some(to_block) = self.to_block {
                    if key.block_num.unwrap() > to_block {
                        return None;
                    }
                }

                let block_timestamp = u64::from_be_bytes(value.as_ref().try_into().unwrap());

                Some((key, block_timestamp))
            } else {
                // Reached the end of the logs for the contract event
                None
            }
        } else {
            None
        }
    }
}
