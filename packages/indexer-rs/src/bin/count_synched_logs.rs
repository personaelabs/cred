use indexer_rs::contract::get_contracts;
use indexer_rs::logger::count_synched_logs;
use indexer_rs::postgres::init_postgres;
use indexer_rs::utils::dotenv_config;
use indexer_rs::ROCKSDB_PATH;
use rocksdb::Options;
use rocksdb::DB;
use std::sync::Arc;

#[tokio::main]
async fn main() -> Result<(), tokio_postgres::Error> {
    dotenv_config();

    let client = init_postgres().await;

    // Get contracts from the database
    let contracts = get_contracts(&client).await;

    let db_options = Options::default();
    let rocksdb_conn = Arc::new(DB::open_for_read_only(&db_options, ROCKSDB_PATH, true).unwrap());

    count_synched_logs(contracts, rocksdb_conn);

    Ok(())
}
