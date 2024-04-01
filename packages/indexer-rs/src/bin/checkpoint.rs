use indexer_rs::utils::dotenv_config;
use indexer_rs::ROCKSDB_PATH;
use rocksdb::checkpoint::Checkpoint;
use rocksdb::Options;
use rocksdb::DB;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

#[tokio::main]
async fn main() {
    dotenv_config();

    let db_options = Options::default();
    let rocksdb_conn = Arc::new(DB::open_for_read_only(&db_options, ROCKSDB_PATH, true).unwrap());

    let checkpoint = Checkpoint::new(&rocksdb_conn).unwrap();
    checkpoint
        .create_checkpoint(format!(
            "./db/checkpoint-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs()
        ))
        .unwrap();
}
