use crate::{contract::ContractType, eth_rpc::Chain, ContractId, GroupType};
use serde::{Deserialize, Serialize};
use std::{
    env,
    fs::{self},
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContractData {
    pub id: Option<u16>,
    pub contract_type: ContractType,
    pub address: String,
    pub name: String,
    pub deployed_block: u64,
    pub chain: Chain,
    pub symbol: String,

    /// The groups that this contract should be derived from.
    /// This is only used for groups that are derived from a single contract.
    pub derive_groups: Vec<GroupType>,
}

/// Get the seed contracts from the seed_contracts.json file
pub fn get_seed_contracts() -> Vec<ContractData> {
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let contracts = fs::read_to_string(format!("{}/src/seeder/seed_contracts.json", manifest_dir))
        .expect("Unable to open contracts.json");

    let contracts: Vec<ContractData> =
        serde_json::from_str(&contracts).expect("Unable to parse contracts.json");

    contracts
}
