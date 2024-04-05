use indexer_rs::{
    contract::upsert_contract,
    group::upsert_group,
    postgres::init_postgres,
    seeder::seed_groups::get_seed_groups,
    utils::{dotenv_config, is_prod},
};
use std::collections::HashSet;

#[tokio::main]
async fn main() {
    dotenv_config();

    // Connect to the database.
    let client = init_postgres().await;

    let groups = get_seed_groups();

    // Populate the contracts that the groups are based on.
    let mut contracts = HashSet::new();
    for group in &groups {
        for contract in &group.contract_inputs {
            contracts.insert(contract.clone());
        }
    }

    for contract in contracts {
        upsert_contract(&client, &contract).await.unwrap();
    }

    // Populate the groups.
    for group in groups {
        upsert_group(&client, group).await.unwrap();
    }
}
