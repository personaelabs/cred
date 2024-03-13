use indexer_rs::contract::get_contracts;
use indexer_rs::contract::ContractType;
use indexer_rs::eth_rpc::EthRpcClient;
use indexer_rs::logger::count_synched_logs;
use indexer_rs::postgres::init_postgres;
use indexer_rs::rocksdb_key::ERC20_TRANSFER_EVENT_ID;
use indexer_rs::rocksdb_key::ERC721_TRANSFER_EVENT_ID;
use indexer_rs::utils::dotenv_config;
use indexer_rs::utils::is_event_logs_ready;
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

    let eth_client = Arc::new(EthRpcClient::new());

    for contract in &contracts {
        let event_id = match contract.contract_type {
            ContractType::ERC20 => ERC20_TRANSFER_EVENT_ID,
            ContractType::ERC721 => ERC721_TRANSFER_EVENT_ID,
            _ => panic!("Invalid contract type"),
        };

        let synched = is_event_logs_ready(&rocksdb_conn, &eth_client, event_id, contract)
            .await
            .unwrap();

        if synched {
            println!("{} synched", contract.symbol.to_uppercase());
        } else {
            println!("{} waiting", contract.symbol.to_uppercase(),);
        }
    }

    count_synched_logs(contracts, rocksdb_conn);

    Ok(())
}
