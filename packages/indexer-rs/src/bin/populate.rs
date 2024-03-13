use indexer_rs::{
    contract::{upsert_contract, Contract, ContractType},
    eth_rpc::Chain,
    postgres::init_postgres,
    utils::{dotenv_config, is_prod},
};

#[tokio::main]
async fn main() {
    dotenv_config();

    // Only run this script in development or in a pull request (i.e. preview environment)
    if !is_prod() {
        // Connect to the database.
        let client = init_postgres().await;

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
}
