use std::sync::Arc;

use indexer_rs::ROCKSDB_PATH;
use indexer_rs::{address_groups::AddressGroups, utils::dotenv_config};
use rocksdb::{Options, WriteBatch, DB};

#[tokio::main]
async fn main() {
    dotenv_config();

    let rocksdb_conn = DB::open_default(ROCKSDB_PATH).unwrap();
    let rocksdb_conn = Arc::new(rocksdb_conn);

    let mut batch = WriteBatch::default();

    let address_to_groups = AddressGroups::get_all(rocksdb_conn.clone());

    for item in address_to_groups {
        let (key, _value) = item.to_key_value();
        batch.delete(key);
    }

    rocksdb_conn.write(batch).unwrap();
}
