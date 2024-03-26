use crate::{
    contract::{Contract, ContractType},
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

    // Get all erc20 contracts from the seed contracts
    let erc20_contracts = seed_contracts
        .iter()
        .filter(|c| c.contract_type == ContractType::ERC20)
        .cloned()
        .collect::<Vec<_>>();

    // Get all erc721 contracts from the seed contracts
    let erc721_contracts = seed_contracts
        .iter()
        .filter(|c| c.contract_type == ContractType::ERC721)
        .cloned()
        .collect::<Vec<ContractData>>();

    // Get all erc1155 contracts from the seed contracts
    let erc1155_contracts = seed_contracts
        .iter()
        .filter(|c| c.contract_type == ContractType::ERC1155)
        .cloned()
        .collect::<Vec<ContractData>>();

    // Build Early holder groups from the erc20 contracts list
    for contract in erc20_contracts.clone() {
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

    // Build Whale groups from the erc20 contracts list
    for contract in erc20_contracts.clone() {
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

    // Build All holders groups from the erc721 contracts list
    for contract in erc721_contracts {
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

    // Build All holders groups from the erc1155 contracts list
    for contract in erc1155_contracts {
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
    groups.push(Group {
        id: Some(group_id),
        name: "$ticker rug survivor".to_string(),
        group_type: GroupType::Ticker,
        contract_inputs: vec![],
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
