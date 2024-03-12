use crate::{
    contract::{Contract, ContractType},
    eth_rpc::Chain,
};

pub fn erc721_contracts() -> Vec<Contract> {
    vec![
        Contract {
            id: 0,
            address: "0x5Af0D9827E0c53E4799BB226655A1de152A425a5".to_string(),
            symbol: "MIL".to_string(),
            name: "Milady".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 13090020,
            target_groups: vec!["allHolders".to_string()],
            contract_type: ContractType::ERC721,
        },
        Contract {
            id: 0,
            address: "0xed5af388653567af2f388e6224dc7c4b3241c544".to_string(),
            symbol: "AZUKI".to_string(),
            name: "Azuki".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 13975838,
            target_groups: vec!["allHolders".to_string()],
            contract_type: ContractType::ERC721,
        },
        Contract {
            id: 0,
            address: "0xbd3531da5cf5857e7cfaa92426877b022e612cf8".to_string(),
            symbol: "PPG".to_string(),
            name: "Pudgy Penguins".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 12876179,
            target_groups: vec!["allHolders".to_string()],
            contract_type: ContractType::ERC721,
        },
        Contract {
            id: 0,
            address: "0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03".to_string(),
            symbol: "NOUN".to_string(),
            name: "Nouns".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 12985438,
            target_groups: vec!["allHolders".to_string()],
            contract_type: ContractType::ERC721,
        },
    ]
}
