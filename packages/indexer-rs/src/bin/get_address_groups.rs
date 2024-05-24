use std::sync::Arc;

use indexer_rs::ROCKSDB_PATH;
use indexer_rs::{address_groups::AddressGroups, utils::dotenv_config};
use rocksdb::{Options, DB};

#[tokio::main]
async fn main() {
    dotenv_config();

    let db_options = Options::default();
    let rocksdb_client = DB::open_for_read_only(&db_options, ROCKSDB_PATH, true).unwrap();
    let rocksdb_client = Arc::new(rocksdb_client);

    let address_to_groups = AddressGroups::get_all(rocksdb_client);

    for item in &address_to_groups {
        println!("Address: {}", hex::encode(item.address));
        println!(
            "Groups: {:?}",
            item.group_ids
                .iter()
                .map(|group_id| hex::encode(group_id))
                .collect::<Vec<String>>()
        );
    }

    println!("Total number of saved addresses: {}", address_to_groups.len());
}
