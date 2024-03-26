use indexer_rs::{merkle_tree_proto::MerkleTree, postgres::init_postgres, utils::dotenv_config};
use prost::Message;
use std::env;

#[tokio::main]
async fn main() {
    dotenv_config();

    let args: Vec<String> = env::args().collect();

    let group_id = args[1].parse::<i32>().unwrap();

    let client = init_postgres().await;

    // Get all Merkle trees from the database
    let trees = client
        .query(
            r#"
            SELECT
                "bloomFilter",
                "treeProtoBuf",
                "groupId",
                id,
                "blockNumber"
            FROM
                "MerkleTree"
            WHERE
                "groupId" = $1
                AND "treeProtoBuf" IS NOT NULL
            ORDER BY
                "blockNumber" DESC
            LIMIT 1
            "#,
            &[&group_id],
        )
        .await
        .unwrap();

    for tree in trees {
        let group_id: i32 = tree.get("groupId");
        let tree_id: i32 = tree.get("id");
        let tree_proto_buf: Vec<u8> = tree.get("treeProtoBuf");
        let bloom_filter: Vec<u8> = tree.get("bloomFilter");
        let block_number: i64 = tree.get("blockNumber");

        let merkle_tree = MerkleTree::decode(&tree_proto_buf[..]).unwrap();
        let members = merkle_tree.layers[0]
            .nodes
            .iter()
            .map(|node| hex::encode(&node.node))
            .collect::<Vec<String>>();

        println!("{:?}", members);

        println!(
            "Group ID: {}, Tree ID: {}, Block Number: {}",
            group_id, tree_id, block_number
        );
        println!("Tree ProtoBuf: {:?}", tree_proto_buf.len());
        println!("Bloom Filter: {:?}", bloom_filter.len());
    }
}
