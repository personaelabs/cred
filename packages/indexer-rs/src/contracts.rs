use crate::{eth_rpc::Chain, Contract};

/// Get all contracts from the postgres
pub async fn get_contracts(pg_clinet: &tokio_postgres::Client) -> Vec<Contract> {
    // Get all contracts from the storage
    let result = pg_clinet
        .query(
            r#"SELECT "id", "address", "name", "symbol", "chain", "deployedBlock" FROM "Contract""#,
            &[],
        )
        .await
        .unwrap();

    let contracts = result
        .iter()
        .map(|row| {
            let contract_id: i32 = row.get("id");
            let contract_address: String = row.get("address");
            let name: String = row.get("name");
            let symbol: String = row.get("symbol");
            let chain: String = row.get("chain");
            let contract_deployed_block: i64 = row.get("deployedBlock");

            // Convert the chain string to Chain enum
            let chain = match chain.as_str() {
                "Ethereum" => Chain::Mainnet,
                "OP Mainnet" => Chain::Optimism,
                "Base" => Chain::Base,
                "Arbitrum One" => Chain::Arbitrum,
                _ => panic!("Invalid chain"),
            };

            Contract {
                id: contract_id,
                address: contract_address,
                chain,
                name: name.clone(),
                symbol: symbol.clone(),
                deployed_block: contract_deployed_block,
            }
        })
        .collect();

    contracts
}
