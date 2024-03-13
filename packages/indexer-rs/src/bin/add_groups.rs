use indexer_rs::{
    postgres::init_postgres, processors::upsert_group, tree::save_tree, utils::dotenv_config,
    GroupType,
};

struct Group {
    handle: &'static str,
    display_name: &'static str,
    group_type: &'static str,
    addresses: Vec<&'static str>,
}

#[tokio::main]
async fn main() {
    dotenv_config();

    let client = init_postgres().await;

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
            &client,
            addresses,
            block_number,
        )
        .await
        .unwrap();
    }
}
