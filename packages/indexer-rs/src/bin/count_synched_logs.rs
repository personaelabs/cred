use std::collections::HashMap;
use std::env;

use num_format::{Locale, ToFormattedString};
use rocksdb::{Direction, Options};
use rocksdb::{IteratorMode, DB};
use tokio_postgres::NoTls;

const PATH: &str = "./db";

#[tokio::main]
async fn main() -> Result<(), tokio_postgres::Error> {
    if env::var("RENDER").is_err() {
        dotenv::from_filename(format!("{}/.env", env::var("CARGO_MANIFEST_DIR").unwrap())).ok();
        dotenv::dotenv().ok();
    }
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

    // Get contracts from the database
    let contracts = client
        .query(
            r#"SELECT "id", "address", "symbol", "chain", "deployedBlock" FROM "Contract""#,
            &[],
        )
        .await
        .unwrap();

    let db_options = Options::default();
    let db = DB::open_for_read_only(&db_options, PATH, true).unwrap();

    // synched
    let mut synched_logs_counts = HashMap::new();
    for contract in contracts {
        let contract_id: i32 = contract.get("id");
        let contract_id_key = &(contract_id as u16).to_be_bytes();
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

        let contract_symbol: String = contract.get("symbol");
        synched_logs_counts.insert(format!("${}", contract_symbol.to_uppercase()), count);
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
