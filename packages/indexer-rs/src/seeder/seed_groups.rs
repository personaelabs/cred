use crate::{
    contract::Contract,
    group::Group,
    seeder::seed_contracts::{get_seed_contracts, ContractData},
    utils::is_prod,
    GroupType,
};

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

    // Build Early holder groups
    for contract in early_holders_contracts.clone() {
        let name = format!("Early ${} holder", contract.symbol.to_uppercase().clone());
        let contract = Contract::from_contract_data(contract);
        let group = Group::new(name, GroupType::EarlyHolder, vec![contract]);

        groups.push(group);
    }

    // Build Whale groups
    for contract in whale_contracts.clone() {
        let name = format!("${} whale", contract.symbol.to_uppercase().clone());
        let contract = Contract::from_contract_data(contract);
        let group = Group::new(name, GroupType::Whale, vec![contract]);

        groups.push(group);
    }

    // Build All holders groups
    for contract in all_holders_contracts.clone() {
        let contract = Contract::from_contract_data(contract);
        let name = format!("{} historical holder", contract.name.clone());
        let group = Group::new(name, GroupType::AllHolders, vec![contract]);

        groups.push(group);
    }

    // Add ticker rug survivor group
    let ticker_contract = seed_contracts
        .iter()
        .find(|c| c.symbol == "ticker")
        .unwrap()
        .clone();
    groups.push(Group::new(
        "$ticker rug survivor".to_string(),
        GroupType::Ticker,
        vec![Contract::from_contract_data(ticker_contract)],
    ));

    // Add creddd team group
    groups.push(Group::new(
        "creddd team".to_string(),
        GroupType::CredddTeam,
        vec![],
    ));

    if is_prod() {
        groups
    } else {
        // Only return a selected few
        let preview_group_ids = vec![
            "f925c0f578b2c6024c5bbb20947e1af3a0eb944e0c309930e3af644ced5200df", // "Early $PIKA holder",
            "167b42ecc5f95c2c10b5fa08a62929d5e3b4ca43783d96a41e7d014e9d0fd02b", // "$KIBSHI whale",
            "55830aa86161ab70bfd6a96e2abd3b338f13bb1848565c8a23c7c7317b5864a5", // $ticker rug survivor
            "0676adf3eb3332e1e2f80daca621727a80f9e1bb793e6864a85656f61489467c", // creddd team
            "158a378c99e764e3b287ed5b1c938ba4125d828a1d9b30aa2fc1c6dd44207419", // The187 historical holder
        ];

        let mut preview_groups = vec![];

        for preview_group_id in preview_group_ids {
            let preview_group = groups
                .iter()
                .find(|g| g.id == preview_group_id)
                .unwrap()
                .clone();

            preview_groups.push(preview_group);
        }

        preview_groups
    }
}
