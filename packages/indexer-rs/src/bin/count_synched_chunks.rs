use indexer_rs::rocksdb_key::KeyType;
use indexer_rs::rocksdb_key::RocksDbKey;
use indexer_rs::utils::dotenv_config;
use indexer_rs::ROCKSDB_PATH;
use rocksdb::IteratorMode;
use rocksdb::Options;
use rocksdb::DB;
use std::env;
use std::sync::Arc;

#[tokio::main]
async fn main() -> Result<(), tokio_postgres::Error> {
    dotenv_config();

    let args: Vec<String> = env::args().collect();

    let contract_id = args[1].parse::<u16>().unwrap();
    let event_id = args[2].parse::<u16>().unwrap();

    let db_options = Options::default();
    let rocksdb_conn = Arc::new(DB::open_for_read_only(&db_options, ROCKSDB_PATH, true).unwrap());

    let start_key = RocksDbKey::new_start_key(KeyType::SyncLog, event_id, contract_id);

    let iterator = rocksdb_conn.iterator(IteratorMode::From(
        &start_key.to_bytes(),
        rocksdb::Direction::Forward,
    ));

    let mut count = 0;
    for item in iterator {
        let (key, _) = item.unwrap();
        let rocksdb_key = RocksDbKey::from_bytes(key.as_ref().try_into().unwrap());
        if rocksdb_key.key_type != KeyType::SyncLog
            || rocksdb_key.event_id != event_id
            || rocksdb_key.contract_id != contract_id
        {
            break;
        }

        count += 1;
    }

    println!("count: {}", count);

    Ok(())
}
