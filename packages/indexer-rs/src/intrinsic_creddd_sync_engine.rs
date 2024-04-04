use crate::{
    merkle_tree_proto::MerkleTree,
    neynar::{get_custody_addresses, get_verified_addresses},
    utils::format_address,
    Error, Fid, TreeId,
};
use log::{error, info};
use prost::Message;
use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
    time::Instant,
};

pub struct IntrinsicCredddSyncEngine {
    fc_replica_client: Arc<tokio_postgres::Client>,
    pg_client: Arc<tokio_postgres::Client>,
}

impl IntrinsicCredddSyncEngine {
    pub fn new(
        fc_replica_client: Arc<tokio_postgres::Client>,
        pg_client: Arc<tokio_postgres::Client>,
    ) -> Self {
        IntrinsicCredddSyncEngine {
            fc_replica_client,
            pg_client,
        }
    }

    /// Get all addresses and the groups they belong to
    async fn get_address_to_trees(
        &self,
    ) -> Result<HashMap<String, HashSet<TreeId>>, tokio_postgres::Error> {
        // Get all Merkle trees from the database
        let trees = self
            .pg_client
            .query(
                r#"
                SELECT DISTINCT ON ("groupId")
                    "treeProtoBuf",
                    "groupId",
                    "MerkleTree".id AS "treeId",
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
            .await?;

        // HashMap to store the mapping (address -> ids of tree that contain the address)
        let mut address_to_trees = HashMap::<String, HashSet<TreeId>>::new();

        for tree in trees {
            let tree_proto_buf: Vec<u8> = tree.get("treeProtoBuf");
            let tree_id: i32 = tree.get("treeId");

            let merkle_tree = MerkleTree::decode(&tree_proto_buf[..]).unwrap();
            let members = merkle_tree.layers[0]
                .nodes
                .iter()
                .map(|node| format!("0x{}", hex::encode(&node.node)))
                .collect::<Vec<String>>();

            for member in members {
                let member = format_address(&member);

                let set = address_to_trees.get_mut(&member);
                match set {
                    Some(set) => {
                        set.insert(tree_id);
                    }
                    None => {
                        let mut new_set = HashSet::new();
                        new_set.insert(tree_id);
                        address_to_trees.insert(member, new_set);
                    }
                }
            }
        }

        Ok(address_to_trees)
    }

    /// Get tha mapping (fid -> verified addresses)
    pub async fn get_fid_to_addresses(
        &self,
    ) -> Result<HashMap<Fid, HashSet<String>>, tokio_postgres::Error> {
        let fid_to_verified_addresses = get_verified_addresses(&self.fc_replica_client).await?;
        let fid_to_custody_address = get_custody_addresses(&self.fc_replica_client).await?;

        // Merge the verified addresses and custody addresses
        let mut fid_to_addresses = HashMap::<i64, HashSet<String>>::new();
        for (fid, verified_addresses) in fid_to_verified_addresses {
            let mut addresses = HashSet::new();
            addresses.extend(verified_addresses);

            fid_to_custody_address.get(&fid).map(|custody_address| {
                addresses.insert(custody_address.clone());
            });

            fid_to_addresses.insert(fid, addresses);
        }

        Ok(fid_to_addresses)
    }

    /// Save the intrinsic creddd in the Postgres database
    async fn save_intrinsic_creddd(
        &self,
        fid_to_trees: HashMap<Fid, HashSet<TreeId>>,
    ) -> Result<(), tokio_postgres::Error> {
        if fid_to_trees.is_empty() {
            return Ok(());
        }

        let params = fid_to_trees
            .iter()
            .flat_map(|(fid, trees)| {
                trees
                    .iter()
                    .map(|tree_id| format!("({}, {}, NOW())", fid, tree_id))
                    .collect::<Vec<String>>()
            })
            .collect::<Vec<String>>()
            .join(",");

        let query = format!(
            r#"
            INSERT INTO "IntrinsicCreddd" ("fid", "treeId", "updatedAt")
            VALUES {}
            ON CONFLICT DO NOTHING
        "#,
            params
        );

        self.pg_client.execute(query.as_str(), &[]).await?;

        Ok(())
    }

    /// Sync the intrinsic creddd
    async fn sync_once(&self) -> Result<(), Error> {
        // Get all addresses

        let start = Instant::now();
        let address_to_trees = self.get_address_to_trees().await?;
        info!("get_address_to_trees: {:?}", start.elapsed());

        let start = Instant::now();
        let fid_to_addresses = self.get_fid_to_addresses().await?;
        info!("get_fid_to_addresses: {:?}", start.elapsed());

        // Map FIDs to groups
        let mut fid_to_trees = HashMap::<Fid, HashSet<TreeId>>::new();

        for (fid, addresses) in fid_to_addresses {
            let mut fid_trees = HashSet::new();
            for address in addresses {
                address_to_trees.get(&address).map(|trees| {
                    fid_trees.extend(trees.iter().cloned());
                });
            }
            fid_to_trees.insert(fid, fid_trees);
        }

        info!("fid_to_trees: {:?}", fid_to_trees.keys().len());

        // Save all packaged creddd
        let start = Instant::now();
        self.save_intrinsic_creddd(fid_to_trees).await?;
        info!("save_intrinsic_creddd: {:?}", start.elapsed());

        Ok(())
    }

    /// Sync the intrinsic creddd every 10 minutes
    pub async fn sync(&self) {
        loop {
            let result = self.sync_once().await;

            if result.is_err() {
                error!("IntrinsicCredddSyncEngine: {:?}", result.err().unwrap());
                tokio::time::sleep(std::time::Duration::from_secs(10)).await;
            } else {
                tokio::time::sleep(std::time::Duration::from_secs(600)).await;
            }
        }
    }
}
