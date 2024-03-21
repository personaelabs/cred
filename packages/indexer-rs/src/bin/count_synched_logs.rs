use indexer_rs::utils::count_synched_logs;
use indexer_rs::utils::dotenv_config;
use indexer_rs::ROCKSDB_PATH;
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
    let to_block = if args.len() > 3 {
        Some(args[3].parse::<u64>().unwrap())
    } else {
        None
    };

    let db_options = Options::default();
    let rocksdb_conn = Arc::new(DB::open_for_read_only(&db_options, ROCKSDB_PATH, true).unwrap());

    let count = count_synched_logs(&rocksdb_conn, event_id, contract_id, to_block);

    println!("count: {}", count);

    Ok(())
}
