use crate::{
    contract::Contract,
    group::Group,
    seeder::seed_contracts::{get_seed_contracts, ContractData},
    GroupType,
};

/// Return all groups to seed the indexer with
pub fn get_seed_groups() -> Vec<Group> {
    // We track the group id to assign to each group
    // (Each group should have a unique id)
    let mut group_id = 1000000;

    // Vector to hold all groups
    let mut groups = vec![];

    // Get all seed contracts
    let seed_contracts = get_seed_contracts();

    // Get all contracts to build the early holder groups from
    let early_holders_contracts = seed_contracts
        .iter()
        .filter(|c| c.derive_groups.contains(&GroupType::EarlyHolder))
        .cloned()
        .collect::<Vec<_>>();

    // Get all contracts to build the whale groups from
    let whale_contracts = seed_contracts
        .iter()
        .filter(|c| c.derive_groups.contains(&GroupType::Whale))
        .cloned()
        .collect::<Vec<ContractData>>();

    // Get all contracts to build the all holders groups from
    let all_holders_contracts = seed_contracts
        .iter()
        .filter(|c| c.derive_groups.contains(&GroupType::AllHolders))
        .cloned()
        .collect::<Vec<ContractData>>();

    // Build Early holder groups
    for contract in early_holders_contracts.clone() {
        let name = format!("Early ${} holder", contract.symbol.to_uppercase().clone());
        let contract = Contract::from_contract_data(contract);
        let group = Group {
            id: Some(group_id),
            name,
            group_type: GroupType::EarlyHolder,
            contract_inputs: vec![contract],
        };
        groups.push(group);
        group_id += 1;
    }

    // Build Whale groups
    for contract in whale_contracts.clone() {
        let name = format!("${} whale", contract.symbol.to_uppercase().clone());
        let contract = Contract::from_contract_data(contract);
        let group = Group {
            id: Some(group_id),
            name,
            group_type: GroupType::Whale,
            contract_inputs: vec![contract],
        };
        groups.push(group);
        group_id += 1;
    }

    // Build All holders groups
    for contract in all_holders_contracts.clone() {
        let contract = Contract::from_contract_data(contract);
        let group = Group {
            id: Some(group_id),
            name: format!("{} historical holder", contract.name.clone()),
            group_type: GroupType::AllHolders,
            contract_inputs: vec![contract],
        };
        groups.push(group);
        group_id += 1;
    }

    // Add ticker rug survivor group
    let ticker_contract = seed_contracts
        .iter()
        .find(|c| c.symbol == "ticker")
        .unwrap()
        .clone();
    groups.push(Group {
        id: Some(group_id),
        name: "$ticker rug survivor".to_string(),
        group_type: GroupType::Ticker,
        contract_inputs: vec![Contract::from_contract_data(ticker_contract)],
    });

    group_id += 1;

    // Add creddd team group
    groups.push(Group {
        id: Some(group_id),
        name: "creddd team".to_string(),
        group_type: GroupType::CredddTeam,
        contract_inputs: vec![],
    });

    groups
}
