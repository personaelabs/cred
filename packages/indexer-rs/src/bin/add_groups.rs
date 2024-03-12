use indexer_rs::{processors::upsert_group, tree::save_tree, GroupType};
use log::error;
use std::env;
use tokio_postgres::NoTls;

struct Group {
    handle: &'static str,
    display_name: &'static str,
    group_type: &'static str,
    addresses: Vec<&'static str>,
}

#[tokio::main]
async fn main() {
    env_logger::init();
    if env::var("RENDER").is_err() {
        dotenv::from_filename(format!("{}/.env", env::var("CARGO_MANIFEST_DIR").unwrap())).ok();
        dotenv::dotenv().ok();
    }
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // Connect to the database.
    let (mut client, connection) = tokio_postgres::connect(&database_url, NoTls).await.unwrap();
    // The connection object performs the actual communication with the database,
    // so spawn it off to run on its own.
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            error!("connection error: {}", e);
        }
    });

    let groups = vec![Group {
        handle: "creddd-team",
        display_name: "creddd team",
        group_type: "static",
        addresses: vec![
            "0x4f7d469a5237bd5feae5a3d852eea4b65e06aad1", // pfeffunit.eth
            "0xcb46219ba114245c3a18761e4f7891f9c4bef8c0", // lsankar.eth
            "0x400ea6522867456e988235675b9cb5b1cf5b79c8", // dantehrani.eth
        ],
    }];

    for group in groups {
        let group_id = upsert_group(
            &client,
            &group.display_name.to_string(),
            &group.handle.to_string(),
            group.group_type,
        )
        .await
        .unwrap();

        let addresses = group
            .addresses
            .iter()
            .map(|address| {
                let address = address.trim_start_matches("0x");
                hex::decode(address).unwrap().try_into().unwrap()
            })
            .collect::<Vec<[u8; 20]>>();

        // For static groups, we need to increment the block number for each new tree
        let latest_group_tree = client
            .query_opt(
                r#"SELECT "id", "blockNumber" FROM "MerkleTree" WHERE "groupId" = $1 ORDER BY "blockNumber" DESC LIMIT 1"#,
                &[&group_id],
            )
            .await
            .unwrap();

        let mut block_number = 0;

        // If there is a latest group tree, increment the block number
        if let Some(row) = latest_group_tree {
            let latest_block_number: i64 = row.get(1);
            block_number = latest_block_number + 1;
        }

        save_tree(
            group_id,
            GroupType::Offchain,
            &mut client,
            addresses,
            block_number,
        )
        .await
        .unwrap();
    }
}
