use indexer_rs::{merkle_tree_proto::MerkleTree, postgres::init_postgres, utils::dotenv_config};
use prost::Message;
use std::collections::{HashMap, HashSet};

#[tokio::main]
async fn main() {
    dotenv_config();

    let client = init_postgres().await;

    // Get all Merkle trees from the database
    let trees = client
        .query(
            r#"
            SELECT DISTINCT ON ("groupId")
                "treeProtoBuf",
                "groupId",
                id,
                "blockNumber"
            FROM
                "MerkleTree"
            ORDER BY
                "groupId",
        	"blockNumber" DESC
            "#,
            &[],
        )
        .await
        .unwrap();

    // HashMap to store the mapping (address -> ids of tree that contain the address)
    let mut address_to_trees = HashMap::<String, HashSet<i32>>::new();

    for tree in trees {
        let tree_id: i32 = tree.get("id");
        let tree_proto_buf: Vec<u8> = tree.get("treeProtoBuf");

        let merkle_tree = MerkleTree::decode(&tree_proto_buf[..]).unwrap();
        let members = merkle_tree.layers[0]
            .nodes
            .iter()
            .map(|node| hex::encode(&node.node))
            .collect::<Vec<String>>();

        for member in members {
            let exiting_set = address_to_trees.get(&member);

            match exiting_set {
                Some(set) => {
                    let mut updated_set = set.clone();
                    updated_set.insert(tree_id);
                    address_to_trees.insert(member, updated_set);
                }
                None => {
                    let mut new_set = HashSet::new();
                    new_set.insert(tree_id);
                    address_to_trees.insert(member, new_set);
                }
            }
        }
    }
}
