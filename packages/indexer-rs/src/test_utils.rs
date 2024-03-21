use rocksdb::{IteratorMode, WriteBatch, DB};

use crate::{
    contract::{Contract, ContractType},
    eth_rpc::Chain,
    GroupType,
};

pub fn erc20_test_contract() -> Contract {
    Contract {
        id: 0,
        contract_type: ContractType::ERC20,
        address: "0x6b431b8a964bfcf28191b07c91189ff4403957d0".to_string(),
        name: "CorgiAI".to_string(),
        deployed_block: 18540899,
        chain: Chain::Mainnet,
        target_groups: vec![GroupType::EarlyHolder, GroupType::Whale],
        symbol: "corgiai".to_string(),
    }
}

pub fn erc721_test_contract() -> Contract {
    Contract {
        id: 0,
        contract_type: ContractType::ERC721,
        address: "0x9ef8750c72061edbeeef4beb1aceee5b5a63748a".to_string(),
        name: "The187".to_string(),
        deployed_block: 17052667,
        chain: Chain::Mainnet,
        target_groups: vec![GroupType::AllHolders],
        symbol: "The187".to_string(),
    }
}

/// Delete all records from a RocksDB database
pub fn delete_all(rocksdb_client: &DB) {
    let iterator = rocksdb_client.iterator(IteratorMode::Start);

    let mut batch = WriteBatch::default();
    for item in iterator {
        let (key, _) = item.unwrap();
        batch.delete(key);
    }

    rocksdb_client.write(batch).unwrap();
}
