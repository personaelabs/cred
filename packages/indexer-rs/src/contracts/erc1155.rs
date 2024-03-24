use crate::{
    contract::{Contract, ContractType},
    eth_rpc::Chain,
    GroupType,
};

pub fn erc1155_contracts() -> Vec<Contract> {
    vec![Contract {
        id: 0,
        address: "0xa41273d9ecce19051e109d87431002fb1404d392".to_string(),
        symbol: "crypto-the-game-s1".to_string(),
        name: "Crypto: The Game S1".to_string(),
        chain: Chain::Base,
        deployed_block: 11088633,
        target_groups: vec![GroupType::AllHolders],
        contract_type: ContractType::ERC1155,
    }]
}
