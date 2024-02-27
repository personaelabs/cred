use std::collections::HashMap;

use indexer_rs::storage::postgres::PostgresStorage;
use indexer_rs::storage::Storage;
use num_format::{Locale, ToFormattedString};
use rocksdb::{Direction, Options};
use rocksdb::{IteratorMode, DB};
use tokio_postgres::NoTls;

const PATH: &str = "./db";

#[tokio::main]
async fn main() -> Result<(), tokio_postgres::Error> {
    dotenv::dotenv().ok();
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // Connect to the database.
    let (client, connection) = tokio_postgres::connect(&database_url, NoTls).await?;
    // The connection object performs the actual communication with the database,
    // so spawn it off to run on its own.
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("connection error: {}", e);
        }
    });

    let storage = PostgresStorage::new(client);

    let contracts = storage.get_contracts().await?;

    let db_options = Options::default();
    let db = DB::open_for_read_only(&db_options, PATH, true).unwrap();
    // synched
    let mut synched_logs_counts = HashMap::new();
    for contract in contracts {
        let contract_id_key = &contract.id.to_be_bytes()[2..];
        let iterator = db.iterator(IteratorMode::From(contract_id_key, Direction::Forward));

        let mut count = 0;
        for item in iterator {
            let (key, _value) = item.unwrap();
            if key.starts_with(contract_id_key) {
                count += 1;
            } else {
                break;
            }
        }

        synched_logs_counts.insert(format!("${}", contract.symbol.to_uppercase()), count);
    }

    let mut sorted_synched_logs_counts = synched_logs_counts
        .into_iter()
        .collect::<Vec<(String, i32)>>();

    sorted_synched_logs_counts.sort_by(|a, b| b.1.cmp(&a.1));

    for (contract, count) in sorted_synched_logs_counts {
        println!("{}: {}", contract, count.to_formatted_string(&Locale::en));
    }

    Ok(())
}
