use std::env;

use indexer_rs::{
    contract::{upsert_contract, Contract, ContractType},
    eth_rpc::Chain,
    processors::upsert_group,
    tree::save_tree,
};
use log::error;
use tokio_postgres::NoTls;

#[tokio::main]
async fn main() {
    if env::var("RENDER").is_err() {
        dotenv::from_filename(format!("{}/.env", env::var("CARGO_MANIFEST_DIR").unwrap())).ok();
        dotenv::dotenv().ok();
    }
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // Connect to the database.
    let (client, connection) = tokio_postgres::connect(&database_url, NoTls).await.unwrap();
    // The connection object performs the actual communication with the database,
    // so spawn it off to run on its own.
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            error!("connection error: {}", e);
        }
    });

    let contracts = [
        Contract {
            id: 0,
            address: "0xa9d54f37ebb99f83b603cc95fc1a5f3907aaccfd".to_string(),
            chain: Chain::Mainnet,
            symbol: "pika".to_string(),
            name: "Pikaboss".to_string(),
            deployed_block: 16628745,
            target_groups: vec!["earlyHolder".to_string(), "whale".to_string()],
            contract_type: ContractType::ERC20,
        },
        Contract {
            id: 0,
            address: "0x02e7f808990638e9e67e1f00313037ede2362361".to_string(),
            chain: Chain::Mainnet,
            symbol: "KIBSHI".to_string(),
            name: "KiboShib".to_string(),
            deployed_block: 16140853,
            target_groups: vec!["earlyHolder".to_string(), "whale".to_string()],
            contract_type: ContractType::ERC20,
        },
    ];

    for contract in &contracts {
        upsert_contract(&client, contract).await.unwrap();
    }

    /*
    let group_id = upsert_group(
        &client,
        &"dev".to_string(),
        &"dev".to_string(),
        &"static".to_string(),
    )
    .await
    .unwrap();

    save_tree(group_id, &client, vec![], 0).await.unwrap();
     */

    // TODO: Upsert some dummy FID attestations
}
