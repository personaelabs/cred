use indexer_rs::contract::get_contracts;
use indexer_rs::logger::count_synched_logs;
use indexer_rs::ROCKSDB_PATH;
use log::error;
use rocksdb::Options;
use rocksdb::DB;
use std::env;
use std::sync::Arc;
use tokio_postgres::NoTls;

#[tokio::main]
async fn main() -> Result<(), tokio_postgres::Error> {
    if env::var("RENDER").is_err() {
        dotenv::from_filename(format!("{}/.env", env::var("CARGO_MANIFEST_DIR").unwrap())).ok();
        dotenv::dotenv().ok();
    }
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // Connect to the database.
    let (client, connection) = tokio_postgres::connect(&database_url, NoTls).await?;
    // The connection object performs the actual communication with the database,
    // so spawn it off to run on its own.
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            error!("connection error: {}", e);
        }
    });

    // Get contracts from the database
    let contracts = get_contracts(&client).await;

    let db_options = Options::default();
    let rocksdb_conn = Arc::new(DB::open_for_read_only(&db_options, ROCKSDB_PATH, true).unwrap());

    count_synched_logs(contracts, rocksdb_conn);

    Ok(())
}
