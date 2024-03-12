use crate::{
    contract::Contract,
    rocksdb_key::{KeyType, RocksDbKey},
};
use core::panic;
use num_format::{Locale, ToFormattedString};
use rocksdb::DB;
use std::{collections::HashMap, sync::Arc};

pub fn count_synced_chunks(rocksdb_conn: Arc<DB>) -> usize {
    let start_key = RocksDbKey {
        key_type: KeyType::SyncLog,
        event_id: 0,
        contract_id: 0,
        block_num: None,
        tx_index: None,
        log_index: None,
        chunk_num: Some(0),
    };

    let iterator = rocksdb_conn.iterator(rocksdb::IteratorMode::From(
        &start_key.to_bytes(),
        rocksdb::Direction::Forward,
    ));

    let mut count = 0;
    for item in iterator {
        let (key_bytes, _value) = item.unwrap();

        let key = RocksDbKey::from_bytes(key_bytes.as_ref().try_into().unwrap());

        if key.key_type != KeyType::SyncLog {
            panic!("Invalid key type");
        }

        count += 1;
    }

    count
}

pub fn count_synched_logs(contracts: Vec<Contract>, rocksdb_conn: Arc<DB>) {
    let mut synched_logs_counts = HashMap::<u16, (usize, usize)>::new();

    let iterator = rocksdb_conn.iterator(rocksdb::IteratorMode::From(
        &[0],
        rocksdb::Direction::Forward,
    ));

    for item in iterator {
        let (key_bytes, _value) = item.unwrap();

        let key = RocksDbKey::from_bytes(key_bytes.as_ref().try_into().unwrap());

        if key.key_type != KeyType::EventLog {
            break;
        }

        let contract_id = key.contract_id;
        // Increment the count for the contract
        let (count, latest_block) = synched_logs_counts.entry(contract_id).or_insert((0, 0));
        *count += 1;
        *latest_block = key.block_num.unwrap() as usize;
    }

    let mut sorted_synched_logs_counts = synched_logs_counts
        .into_iter()
        .collect::<Vec<(u16, (usize, usize))>>();

    sorted_synched_logs_counts.sort_by(|a, b| b.1 .0.cmp(&a.1 .0));

    for (contract, (count, latest_block)) in sorted_synched_logs_counts {
        let contract_symbol = contracts
            .iter()
            .find(|c| c.id == contract)
            .unwrap()
            .symbol
            .to_uppercase();

        println!(
            "${}: {} ({})",
            contract_symbol,
            count.to_formatted_string(&Locale::en),
            latest_block
        );
    }
}
