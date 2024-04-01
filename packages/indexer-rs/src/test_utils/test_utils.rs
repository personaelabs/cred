use crate::{
    contract::{Contract, ContractType},
    eth_rpc::Chain,
    Address, ROCKSDB_PATH,
};
use rocksdb::{IteratorMode, Options, WriteBatch, DB};
use std::{env, fs::File, sync::Arc};

/// Get a test ERC20 contract
pub fn erc20_test_contract() -> Contract {
    Contract {
        id: 0,
        contract_type: ContractType::ERC20,
        address: "0x6b431b8a964bfcf28191b07c91189ff4403957d0".to_string(),
        name: "CorgiAI".to_string(),
        deployed_block: 18540899,
        chain: Chain::Mainnet,
    }
}

/// Get a test ERC721 contract
pub fn erc721_test_contract() -> Contract {
    Contract {
        id: 0,
        contract_type: ContractType::ERC721,
        address: "0x9ef8750c72061edbeeef4beb1aceee5b5a63748a".to_string(),
        name: "The187".to_string(),
        deployed_block: 17052667,
        chain: Chain::Mainnet,
    }
}

/// Get a test ERC1155 contract
pub fn erc1155_test_contract() -> Contract {
    Contract {
        id: 0,
        contract_type: ContractType::ERC1155,
        address: "0xa41273d9ecce19051e109d87431002fb1404d392".to_string(),
        name: "Crypto: The Game Players".to_string(),
        deployed_block: 11088633,
        chain: Chain::Base,
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

/// Get a list of addresses from a CSV file
pub fn get_members_from_csv(file_name: &str) -> Vec<Address> {
    let cargo_manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let file = File::open(format!(
        "{}/src/test_utils/{}",
        cargo_manifest_dir, file_name
    ))
    .unwrap();

    // Build the CSV reader and iterate over each record.
    let mut rdr = csv::Reader::from_reader(file);

    let mut addresses = rdr
        .records()
        .map(|record| {
            let record = record.unwrap();
            let address = record.get(0).unwrap().to_string();

            hex::decode(address.trim_start_matches("0x"))
                .unwrap()
                .try_into()
                .unwrap()
        })
        .collect::<Vec<Address>>();

    addresses.sort();

    addresses
}

/// Initialize a test RocksDB database
/// - `test_name`: The name of the test. The database will be stored in a directory with this name.
pub fn init_test_rocksdb(test_name: &str) -> Arc<DB> {
    let mut rocksdb_options = Options::default();
    rocksdb_options.create_if_missing(true);

    // We use a different path for the test db to avoid conflicts with the main db
    let rocksdb_path = format!("{}/{}", ROCKSDB_PATH, test_name);

    let rocksdb_conn = DB::open(&rocksdb_options, rocksdb_path).unwrap();

    // Delete all records from the test db
    delete_all(&rocksdb_conn);

    Arc::new(rocksdb_conn)
}
