use csv::Writer;
use indexer_rs::{
    merkle_tree_proto::MerkleTree,
    postgres::init_postgres,
    utils::{dotenv_config, format_address},
};
use prost::Message;
use std::{
    collections::{HashMap, HashSet},
    fs::File,
};

/// Get all addresses and the groups they belong to
async fn get_address_to_groups(
    client: &tokio_postgres::Client,
) -> HashMap<String, HashSet<String>> {
    // Get all Merkle trees from the database
    let trees = client
        .query(
            r#"
            SELECT DISTINCT ON ("groupId")
            "treeProtoBuf",
            "groupId",
            "MerkleTree".id,
            "blockNumber",
            "Group"."displayName"
        FROM
            "MerkleTree"
            LEFT JOIN "Group" ON "MerkleTree"."groupId" = "Group".id
        ORDER BY
            "groupId",
            "blockNumber" DESC
            "#,
            &[],
        )
        .await
        .unwrap();

    // HashMap to store the mapping (address -> ids of tree that contain the address)
    let mut address_to_groups = HashMap::<String, HashSet<String>>::new();

    for tree in trees {
        let tree_proto_buf: Vec<u8> = tree.get("treeProtoBuf");
        let group_name: String = tree.get("displayName");

        let merkle_tree = MerkleTree::decode(&tree_proto_buf[..]).unwrap();
        let members = merkle_tree.layers[0]
            .nodes
            .iter()
            .map(|node| format!("0x{}", hex::encode(&node.node)))
            .collect::<Vec<String>>();

        for member in members {
            let member = format_address(&member);

            let set = address_to_groups.get_mut(&member);
            match set {
                Some(set) => {
                    set.insert(group_name.clone());
                }
                None => {
                    let mut new_set = HashSet::new();
                    new_set.insert(group_name.clone());
                    address_to_groups.insert(member, new_set);
                }
            }
        }
    }

    address_to_groups
}

#[tokio::main]
async fn main() {
    dotenv_config();

    let client = init_postgres().await;

    let address_to_groups = get_address_to_groups(&client).await;

    // Addresses to their groups
    let file = File::create("address_to_groups.csv").unwrap();

    let mut rows: Vec<Vec<String>> = vec![];

    for address in address_to_groups.keys() {
        for group_name in address_to_groups.get(address).unwrap() {
            rows.push(vec![format_address(address).clone(), group_name.clone()]);
        }
    }

    // Create a file to write CSV data
    // Create a CSV writer
    let mut writer = Writer::from_writer(file);

    for row in rows {
        writer.write_record(row).unwrap();
    }

    writer.flush().unwrap();
}
