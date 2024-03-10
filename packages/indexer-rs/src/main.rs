use futures::future::join_all;
use futures::join;
use indexer_rs::eth_rpc::EthRpcClient;
use indexer_rs::log_sync_engine::LogSyncEngine;
use indexer_rs::ROCKSDB_PATH;
use indexer_rs::{contract::get_contracts, tree::index_groups_for_contract};
use log::error;
use rocksdb::{Options, DB};
use std::env;
use std::sync::Arc;
use tokio_postgres::NoTls;

#[tokio::main]
async fn main() {
    env_logger::init();

    let is_render = env::var("RENDER").is_ok();
    let manifest_dir = env::var("CARGO_MANIFEST_DIR");
    if !is_render && manifest_dir.is_ok() {
        // Call dotenv in non-render environment
        dotenv::from_filename(format!("{}/.env", manifest_dir.unwrap())).ok();
        dotenv::dotenv().ok();
    } else {
        dotenv::dotenv().ok();
    }

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    // Connect to the database.
    let (pg_client, connection) = tokio_postgres::connect(&database_url, NoTls).await.unwrap();
    let pg_client = Arc::new(pg_client);

    // The connection object performs the actual communication with the database,
    // so spawn it off to run on its own.
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            error!("connection error: {}", e);
        }
    });

    let contracts = get_contracts(&pg_client).await;

    // Open the RocksDB connection
    let mut rocksdb_options = Options::default();
    rocksdb_options.create_if_missing(true);
    let rocksdb_conn = DB::open(&rocksdb_options, ROCKSDB_PATH).unwrap();

    let rocksdb_conn = rocksdb_conn;
    let rocksdb_client = Arc::new(rocksdb_conn);

    let eth_client = Arc::new(EthRpcClient::new());

    let mut sync_jobs = vec![];
    for contract in contracts.clone() {
        let rocksdb_client = rocksdb_client.clone();
        let eth_client = eth_client.clone();

        let job = tokio::spawn(async move {
            let contract_sync_engine = LogSyncEngine::new(eth_client, contract, rocksdb_client);
            contract_sync_engine.sync().await;
        });

        sync_jobs.push(job);
    }

    let mut indexing_jobs = vec![];

    for contract in contracts.clone() {
        let rocksdb_client = rocksdb_client.clone();
        let eth_client = eth_client.clone();
        let pg_client = pg_client.clone();

        let job = tokio::spawn(async move {
            index_groups_for_contract(
                pg_client.clone(),
                rocksdb_client.clone(),
                eth_client.clone(),
                contract.clone(),
            )
            .await;
        });

        indexing_jobs.push(job);
    }

    // Run the sync and indexing jobs concurrently
    join!(join_all(sync_jobs), join_all(indexing_jobs));
}
