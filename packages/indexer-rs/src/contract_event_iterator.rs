use rocksdb::{DBIteratorWithThreadMode, IteratorMode, ReadOptions, DB};

use crate::{
    rocksdb_key::{KeyType, RocksDbKey},
    BlockNum, ContractId, EventId,
};

/// An iterator over the event logs for a contract.
/// It wraps the RocksDB iterator and filters the logs for a specific contract and event.
pub struct ContractEventIterator<'a> {
    event_id: EventId,
    contract_id: ContractId,
    to_block: Option<BlockNum>,
    inner: DBIteratorWithThreadMode<'a, DB>,
}

impl<'a> ContractEventIterator<'a> {
    pub fn new(
        db: &'a DB,
        event_id: EventId,
        contract_id: ContractId,
        to_block: Option<BlockNum>,
    ) -> Self {
        // Initialize the RocksDB iterator that starts from the first log for `contract.id`
        let mut iterator_ops = ReadOptions::default();
        iterator_ops.set_async_io(true);

        let start_key = RocksDbKey::new_start_key(KeyType::EventLog, event_id, contract_id);

        let iterator = db.iterator_opt(
            IteratorMode::From(&start_key.to_bytes(), rocksdb::Direction::Forward),
            iterator_ops,
        );

        Self {
            event_id,
            contract_id,
            to_block,
            inner: iterator,
        }
    }
}

impl Iterator for ContractEventIterator<'_> {
    type Item = (RocksDbKey, Vec<u8>);

    fn next(&mut self) -> Option<Self::Item> {
        let item = self.inner.next();

        if let Some(item) = item {
            let (key, value) = item.unwrap();
            let key = RocksDbKey::from_bytes(key.as_ref().try_into().unwrap());

            if key.key_type == KeyType::EventLog
                && key.contract_id == self.contract_id
                && key.event_id == self.event_id
            {
                if let Some(to_block) = self.to_block {
                    if key.block_num.unwrap() > to_block {
                        return None;
                    }
                }

                Some((key, value.to_vec()))
            } else {
                // Reached the end of the logs for the contract event
                None
            }
        } else {
            None
        }
    }
}
