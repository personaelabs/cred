use crate::{eth_rpc::Chain, seeder::seed_contracts::ContractData, BlockNum, ContractId, Error};
use postgres_types::{FromSql, ToSql};
use serde::{Deserialize, Serialize};

#[derive(Debug, Copy, Clone, Hash, PartialEq, Eq, FromSql, ToSql, Serialize, Deserialize)]
#[postgres(name = "ContractType")]
pub enum ContractType {
    ERC20,
    ERC721,
    ERC1155,
    Punk,
    Other,
}

#[derive(Debug, Clone, Hash, PartialEq, Eq)]
pub struct Contract {
    pub id: ContractId,
    pub address: String,
    pub chain: Chain,
    pub contract_type: ContractType,
    pub name: String,
    pub deployed_block: BlockNum,
}

impl Contract {
    pub fn from_contract_data(data: ContractData) -> Self {
        if data.id.is_none() {
            panic!("Contract id is required");
        }

        Contract {
            id: data.id.unwrap(),
            address: data.address,
            chain: data.chain,
            contract_type: data.contract_type,
            name: data.name,
            deployed_block: data.deployed_block,
        }
    }
}

/// Upsert a contract into the database
pub async fn upsert_contract(
    pg_client: &tokio_postgres::Client,
    contract: &Contract,
) -> Result<(), tokio_postgres::Error> {
    let chain = match contract.chain {
        Chain::Mainnet => "Ethereum",
        Chain::Optimism => "OP Mainnet",
        Chain::Base => "Base",
        Chain::Arbitrum => "Arbitrum One",
        Chain::Blast => "Blast",
    };

    // The contract doesn't exist yet so we insert it

    pg_client
        .execute(
            r#"INSERT INTO "Contract" ("id", "address", "type", "name", "chain", "deployedBlock",  "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT ("id", "address", "chain") DO UPDATE SET "type" = $3, "name" = $4, "deployedBlock" = $6, "updatedAt" = NOW()
            "#,
            &[
                &(contract.id as i32),
                &contract.address.to_lowercase(),
                &contract.contract_type,
                &contract.name,
                &chain,
                &(contract.deployed_block as i64) ,
            ],
        )
        .await?;

    Ok(())
}

/// Get all contracts from the postgres
pub async fn get_contracts(pg_clinet: &tokio_postgres::Client) -> Result<Vec<Contract>, Error> {
    // Get all contracts from the storage
    let result = pg_clinet
        .query(
            r#"SELECT "id", "address", "type",  "name", "chain", "deployedBlock" FROM "Contract""#,
            &[],
        )
        .await?;

    let contracts = result
        .iter()
        .map(|row| {
            let contract_id: i32 = row.get("id");
            let contract_address: String = row.get("address");
            let name: String = row.get("name");
            let chain: String = row.get("chain");
            let contract_deployed_block: i64 = row.get("deployedBlock");
            let contract_type: ContractType = row.get("type");

            // Convert the chain string to Chain enum
            let chain = match chain.as_str() {
                "Ethereum" => Chain::Mainnet,
                "OP Mainnet" => Chain::Optimism,
                "Base" => Chain::Base,
                "Arbitrum One" => Chain::Arbitrum,
                "Blast" => Chain::Blast,
                _ => panic!("Invalid chain"),
            };

            Contract {
                id: contract_id as ContractId,
                address: contract_address,
                chain,
                name: name.clone(),
                deployed_block: contract_deployed_block as u64,
                contract_type,
            }
        })
        .collect();

    Ok(contracts)
}
