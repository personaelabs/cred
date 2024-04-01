use indexer_rs::log_sync_engine::CHUNK_SIZE;
use indexer_rs::utils::count_synched_chunks;
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

    let db_options = Options::default();
    let rocksdb_conn = Arc::new(DB::open_for_read_only(&db_options, ROCKSDB_PATH, true).unwrap());

    let count = count_synched_chunks(&rocksdb_conn, event_id, contract_id);

    let synched_block_num = (count as u64) * CHUNK_SIZE;

    println!("Synched chunks: {}", count);
    println!("Synched blocks: {}", synched_block_num);

    Ok(())
}
