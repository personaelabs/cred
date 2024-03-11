use crate::eth_rpc::Chain;
use postgres_types::{FromSql, ToSql};

#[derive(Debug, Clone, FromSql, ToSql)]
#[postgres(name = "ContractType")]
pub enum ContractType {
    ERC20,
    ERC721,
    Other,
}

#[derive(Debug, Clone)]
pub struct Contract {
    pub id: u16,
    pub address: String,
    pub chain: Chain,
    pub contract_type: ContractType,
    pub target_groups: Vec<String>,
    pub name: String,
    pub symbol: String,
    pub deployed_block: u64,
}

/// Get all contracts from the postgres
pub async fn get_contracts(pg_clinet: &tokio_postgres::Client) -> Vec<Contract> {
    // Get all contracts from the storage
    let result = pg_clinet
        .query(
            r#"SELECT "id", "address", "type", "targetGroups", "name", "symbol", "chain", "deployedBlock" FROM "Contract""#,
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
            let contract_type: ContractType = row.get("type");
            let target_groups: Vec<String> = row.get("targetGroups");

            // Convert the chain string to Chain enum
            let chain = match chain.as_str() {
                "Ethereum" => Chain::Mainnet,
                "OP Mainnet" => Chain::Optimism,
                "Base" => Chain::Base,
                "Arbitrum One" => Chain::Arbitrum,
                _ => panic!("Invalid chain"),
            };

            Contract {
                id: contract_id as u16,
                address: contract_address,
                chain,
                name: name.clone(),
                symbol: symbol.clone(),
                deployed_block: contract_deployed_block as u64,
                contract_type,
                target_groups,
            }
        })
        .collect();

    contracts
}
