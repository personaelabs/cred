use indexer_rs::rocksdb_key::KeyType;
use indexer_rs::rocksdb_key::RocksDbKey;
use indexer_rs::utils::dotenv_config;
use indexer_rs::ROCKSDB_PATH;
use rocksdb::WriteBatch;
use rocksdb::DB;
use std::env;

// Delete all event logs and sync logs for a given contract event
#[tokio::main]
async fn main() -> Result<(), tokio_postgres::Error> {
    dotenv_config();

    let args: Vec<String> = env::args().collect();

    let contract_id = args[1].parse::<u16>().unwrap();
    let event_id = args[2].parse::<u16>().unwrap();

    let rocksdb_conn = DB::open_default(ROCKSDB_PATH).unwrap();

    let mut batch = WriteBatch::default();

    // First, delete all event logs
    let event_log_start_key = RocksDbKey::new_start_key(KeyType::EventLog, event_id, contract_id);

    let iterator = rocksdb_conn.iterator(rocksdb::IteratorMode::From(
        &event_log_start_key.to_bytes(),
        rocksdb::Direction::Forward,
    ));

    let mut count = 0;
    for item in iterator {
        let (key_bytes, _value) = item.unwrap();

        let key = RocksDbKey::from_bytes(key_bytes.as_ref().try_into().unwrap());

        if key.key_type != KeyType::EventLog
            || key.event_id.unwrap() != event_id
            || key.contract_id.unwrap() != contract_id
        {
            break;
        }

        batch.delete(key.to_bytes());
        count += 1;
    }

    println!("Deleting {} event logs..", count);

    // Second, delete the sync logs
    let sync_log_start_key = RocksDbKey::new_start_key(KeyType::SyncLog, event_id, contract_id);
    let iterator = rocksdb_conn.iterator(rocksdb::IteratorMode::From(
        &sync_log_start_key.to_bytes(),
        rocksdb::Direction::Forward,
    ));
    let mut count = 0;
    for item in iterator {
        let (key_bytes, _value) = item.unwrap();
        let key = RocksDbKey::from_bytes(key_bytes.as_ref().try_into().unwrap());
        if key.key_type != KeyType::SyncLog
            || key.event_id.unwrap() != event_id
            || key.contract_id.unwrap() != contract_id
        {
            break;
        }
        batch.delete(key.to_bytes());
        count += 1;
    }
    println!("Deleting {} sync logs..", count);

    println!(
        "Deleting event logs and sync logs for event_id: {}, contract_id: {}..",
        event_id, contract_id
    );
    rocksdb_conn.write(batch).unwrap();
    println!("Done");

    Ok(())
}
