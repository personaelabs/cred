use indexer_rs::{
    merkle_tree_proto::MerkleTree,
    postgres::{init_neynar_db, init_postgres},
    utils::dotenv_config,
};
use prost::Message;
use std::io::Write;
use std::{
    collections::{HashMap, HashSet},
    fs::File,
};

fn format_address(address: &str) -> String {
    format!(
        "0x{:0>width$}",
        address.trim_start_matches("0x"),
        width = 64
    )
}

/// Get all verified addresses from the Neynar database
async fn get_verified_addresses(client: &tokio_postgres::Client) -> HashMap<i64, Vec<String>> {
    let verified_addresses = client
        .query(
            r#"
            SELECT
                fid,
                ARRAY_AGG(claim->>'address') as "addresses"
            FROM
                verifications
            WHERE
                deleted_at IS NULL
            GROUP BY
                fid
            "#,
            &[],
        )
        .await
        .unwrap();

    let mut fid_to_verified_addresses = HashMap::<i64, Vec<String>>::new();

    for verified_address in verified_addresses {
        let fid: i64 = verified_address.get("fid");
        let addresses: Vec<String> = verified_address.get("addresses");

        if fid_to_verified_addresses.get(&fid).is_some() {
            panic!("Duplicate fid: {}", fid);
        }

        // Format addresses
        let addresses = addresses
            .iter()
            .map(|address| format_address(address))
            .collect::<Vec<String>>();

        fid_to_verified_addresses.insert(fid, addresses);
    }

    fid_to_verified_addresses
}

/// Get all custody addresses from the Neynar database
async fn get_custody_addresses(client: &tokio_postgres::Client) -> HashMap<i64, String> {
    let custody_addresses = client
        .query(
            r#"
            SELECT
                fid,
                custody_address
            FROM
                fids
            ORDER BY
                fid ASC
            "#,
            &[],
        )
        .await
        .unwrap();

    let mut fid_to_custody_address = HashMap::<i64, String>::new();

    for custody_address in custody_addresses {
        let fid: i64 = custody_address.get("fid");
        let address: Vec<u8> = custody_address.get("custody_address");

        let address = format_address(&hex::encode(address));

        if fid_to_custody_address.get(&fid).is_some() {
            panic!("Duplicate fid: {}", fid);
        }

        fid_to_custody_address.insert(fid, address);
    }

    fid_to_custody_address
}

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

    let neynar_db_client = init_neynar_db().await;

    let fid_to_verified_addresses = get_verified_addresses(&neynar_db_client).await;
    let fid_to_custody_address = get_custody_addresses(&neynar_db_client).await;

    let mut fid_to_addresses = HashMap::<i64, HashSet<String>>::new();

    for (fid, addresses) in fid_to_verified_addresses {
        let mut set = HashSet::new();

        for address in addresses {
            set.insert(address.clone());
        }

        fid_to_addresses.insert(fid, set);
    }

    for (fid, custody_address) in fid_to_custody_address {
        let set = fid_to_addresses.get_mut(&fid);

        match set {
            Some(set) => {
                set.insert(custody_address);
            }
            None => {
                let mut new_set = HashSet::new();
                new_set.insert(custody_address);
                fid_to_addresses.insert(fid, new_set);
            }
        }
    }

    let mut fids_to_groups = HashMap::<i64, HashSet<String>>::new();

    for (fid, addresses) in fid_to_addresses {
        let mut groups = HashSet::new();

        for address in addresses {
            let groups_for_address = address_to_groups.get(&address);

            match groups_for_address {
                Some(_groups) => {
                    for group in _groups {
                        groups.insert(group.clone());
                    }
                }
                None => {}
            }
        }

        if fids_to_groups.get(&fid).is_some() {
            panic!("Duplicate fid: {}", fid);
        }

        if !groups.is_empty() {
            fids_to_groups.insert(fid, groups);
        }
    }

    println!("Total fids with creddd: {}", fids_to_groups.keys().len());

    let result = serde_json::to_string_pretty(&fids_to_groups).unwrap();
    let mut file = File::create("fids_to_groups.json").unwrap();

    file.write_all(result.as_bytes()).unwrap();
}
