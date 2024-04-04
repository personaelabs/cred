use crate::{
    contract::Contract,
    group::Group,
    seeder::{
        assets_with_prices::get_assets_with_prices,
        seed_contracts::{get_seed_contracts, ContractData},
    },
    GroupState, GroupType,
};
/// Calculate the score for a group
fn calculate_group_score(group_type: GroupType, contract_inputs: &[&str]) -> i64 {
    let asset_with_prices = get_assets_with_prices();

    let contract_address = contract_inputs[0];

    // Find the contract in the assets_with_prices.json
    let contract = asset_with_prices
        .iter()
        .find(|a| a.address.to_lowercase() == contract_address.to_lowercase());

    if contract.is_none() {
        panic!(
            "Contract not found in assets_with_prices.json: {}",
            contract_address
        );
    }

    let contract = contract.unwrap();

    match group_type {
        GroupType::EarlyHolder => contract.fdv_usd.unwrap().round() as i64,
        GroupType::Whale => contract.fdv_usd.unwrap().round() as i64,
        GroupType::Believer => contract.fdv_usd.unwrap().round() as i64,
        GroupType::AllHolders => contract.fp_usd.unwrap().round() as i64,
        GroupType::Ticker => contract.fdv_usd.unwrap().round() as i64,
        GroupType::CredddTeam => 0,
        _ => panic!("Deprecated group type {:?}", group_type),
    }
}

/// Return all groups to seed the indexer with
pub fn get_seed_groups() -> Vec<Group> {
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

    // Get all contracts to build the believer groups from
    let believer_contracts = seed_contracts
        .iter()
        .filter(|c| c.derive_groups.contains(&GroupType::Believer))
        .cloned()
        .collect::<Vec<ContractData>>();

    // Build Early holder groups
    for contract in early_holders_contracts.clone() {
        let name = format!("Early {} holder", contract.name.clone());
        let contract = Contract::from_contract_data(contract);
        let score = calculate_group_score(GroupType::EarlyHolder, &[&contract.address]);
        let group = Group::new(
            name,
            GroupType::EarlyHolder,
            vec![contract],
            score,
            GroupState::Recordable,
        );

        groups.push(group);
    }

    // Build Whale groups
    for contract in whale_contracts.clone() {
        let name = format!("{} whale", contract.name.clone());
        let contract = Contract::from_contract_data(contract);
        let score = calculate_group_score(GroupType::Whale, &[&contract.address]);
        let group = Group::new(
            name,
            GroupType::Whale,
            vec![contract],
            score,
            GroupState::Recordable,
        );

        groups.push(group);
    }

    // Build All holders groups
    for contract in all_holders_contracts.clone() {
        let contract = Contract::from_contract_data(contract);
        let name = format!("{} historical holder", contract.name.clone());
        let score = calculate_group_score(GroupType::AllHolders, &[&contract.address]);
        let group = Group::new(
            name,
            GroupType::AllHolders,
            vec![contract],
            score,
            GroupState::Recordable,
        );

        groups.push(group);
    }

    // Build believer group
    for contract in believer_contracts.clone() {
        let contract = Contract::from_contract_data(contract);
        let name = format!("{} believer", contract.name.clone());
        let score = calculate_group_score(GroupType::Believer, &[&contract.address]);
        let group = Group::new(
            name,
            GroupType::Believer,
            vec![contract],
            score,
            GroupState::Recordable,
        );

        groups.push(group);
    }

    // Add ticker rug survivor group
    let ticker_contract = seed_contracts
        .iter()
        .find(|c| c.symbol == "ticker")
        .unwrap()
        .clone();

    let ticker_score = calculate_group_score(GroupType::Ticker, &[&ticker_contract.address]);
    groups.push(Group::new(
        "$ticker rug survivor".to_string(),
        GroupType::Ticker,
        vec![Contract::from_contract_data(ticker_contract)],
        ticker_score,
        GroupState::Recordable,
    ));

    // Add creddd team group
    groups.push(Group::new(
        "creddd team".to_string(),
        GroupType::CredddTeam,
        vec![],
        0,
        GroupState::Recordable,
    ));

    groups
}
