use futures::future::join_all;
use futures::join;
use indexer_rs::eth_rpc::EthRpcClient;
use indexer_rs::log_sync_engine::LogSyncEngine;
use indexer_rs::postgres::init_postgres;
use indexer_rs::utils::dotenv_config;
use indexer_rs::ROCKSDB_PATH;
use indexer_rs::{contract::get_contracts, tree::index_groups_for_contract};
use rocksdb::{Options, DB};
use std::sync::Arc;
use tokio::sync::Semaphore;

#[tokio::main]
async fn main() {
    dotenv_config();

    let pg_client = init_postgres().await;
    let contracts = get_contracts(&pg_client).await;
    let eth_client = Arc::new(EthRpcClient::new());
    /*

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
     */

    let rocksdb_options = Options::default();
    let rocksdb_client =
        Arc::new(DB::open_for_read_only(&rocksdb_options, ROCKSDB_PATH, false).unwrap());

    let mut indexing_jobs = vec![];

    let indexing_permits = Arc::new(Semaphore::new(5));

    for contract in contracts.clone() {
        let rocksdb_client = rocksdb_client.clone();
        let eth_client = eth_client.clone();
        let pg_client = pg_client.clone();
        let indexing_permits = indexing_permits.clone();

        let job = tokio::spawn(async move {
            index_groups_for_contract(
                indexing_permits,
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
    // join!(join_all(sync_jobs), join_all(indexing_jobs));
    join_all(indexing_jobs).await;
}
