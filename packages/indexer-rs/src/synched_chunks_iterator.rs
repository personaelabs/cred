use rocksdb::{DBIteratorWithThreadMode, IteratorMode, ReadOptions, DB};

use crate::{
    rocksdb_key::{KeyType, RocksDbKey},
    ChunkNum, ContractId, EventId,
};

/// An iterator over the synched chunks of a contract event.
/// It wraps the RocksDB iterator and filters the synched chunks for a specific contract and event.
pub struct SynchedChunksIterator<'a> {
    event_id: EventId,
    contract_id: ContractId,
    inner: DBIteratorWithThreadMode<'a, DB>,
}

impl<'a> SynchedChunksIterator<'a> {
    pub fn new(db: &'a DB, event_id: EventId, contract_id: ContractId) -> Self {
        // Initialize the RocksDB iterator that starts from the first log for `contract.id`
        let mut iterator_ops = ReadOptions::default();
        iterator_ops.set_async_io(true);

        let start_key = RocksDbKey::new_start_key(KeyType::SyncLog, event_id, contract_id);

        let iterator = db.iterator_opt(
            IteratorMode::From(&start_key.to_bytes(), rocksdb::Direction::Forward),
            iterator_ops,
        );

        Self {
            event_id,
            contract_id,
            inner: iterator,
        }
    }
}

impl Iterator for SynchedChunksIterator<'_> {
    type Item = ChunkNum;

    fn next(&mut self) -> Option<Self::Item> {
        let item = self.inner.next();

        if let Some(item) = item {
            let (key, _) = item.unwrap();
            let key = RocksDbKey::from_bytes(key.as_ref().try_into().unwrap());

            if key.key_type == KeyType::SyncLog
                && key.contract_id.unwrap() == self.contract_id
                && key.event_id.unwrap() == self.event_id
            {
                Some(key.chunk_num.unwrap())
            } else {
                // Reached the end of the logs for the contract event
                None
            }
        } else {
            None
        }
    }
}
