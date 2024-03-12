use indexer_rs::contract::upsert_contract;
use indexer_rs::contracts::erc721::erc721_contracts;
use log::error;
use std::env;
use tokio_postgres::NoTls;

#[tokio::main]
async fn main() {
    env_logger::init();
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

    let mut contracts = vec![];

    contracts.extend(erc721_contracts().iter().cloned());

    for contract in contracts {
        upsert_contract(&client, &contract).await.unwrap();
    }
}
