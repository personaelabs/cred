use indexer_rs::contract::upsert_contract;
use indexer_rs::contracts::erc20::erc20_contracts;
use indexer_rs::contracts::erc721::erc721_contracts;
use indexer_rs::postgres::init_postgres;
use indexer_rs::utils::dotenv_config;

#[tokio::main]
async fn main() {
    dotenv_config();

    let client = init_postgres().await;

    let mut contracts = vec![];

    contracts.extend(erc721_contracts().iter().cloned());
    contracts.extend(erc20_contracts().iter().cloned());

    for contract in contracts {
        upsert_contract(&client, &contract).await.unwrap();
    }
}
