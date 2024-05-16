use crate::{
    contract::{get_contracts, Contract},
    utils::{get_group_id, is_prod},
    BlockNum, GroupId, GroupState, GroupType,
};

const PREVIEW_GROUP_IDS: [&str; 6] = [
    "f925c0f578b2c6024c5bbb20947e1af3a0eb944e0c309930e3af644ced5200df", // "Early $PIKA holder",
    "167b42ecc5f95c2c10b5fa08a62929d5e3b4ca43783d96a41e7d014e9d0fd02b", // "$KIBSHI whale",
    "55830aa86161ab70bfd6a96e2abd3b338f13bb1848565c8a23c7c7317b5864a5", // $ticker rug survivor
    "0676adf3eb3332e1e2f80daca621727a80f9e1bb793e6864a85656f61489467c", // creddd team
    "158a378c99e764e3b287ed5b1c938ba4125d828a1d9b30aa2fc1c6dd44207419", // The187 historical holder
    "3544a1d252e2cfffb5d977c9dd2e3766b13a72ea4206c5e29b69502de62a6023", // $Higher believer
];

#[derive(Debug, Clone)]
pub struct Group {
    pub id: GroupId,
    pub name: String,
    pub score: i64,
    pub group_type: GroupType,
    pub contract_inputs: Vec<Contract>,
}

impl Group {
    pub fn new(
        name: String,
        group_type: GroupType,
        contract_inputs: Vec<Contract>,
        score: i64,
    ) -> Self {
        let contract_addresses = contract_inputs
            .iter()
            .map(|contract| contract.address.clone())
            .collect::<Vec<String>>();

        let group_id = get_group_id(group_type, &contract_addresses);

        Group {
            id: group_id,
            name,
            group_type,
            contract_inputs,
            score,
        }
    }
}

/// Update the state of a group
pub async fn update_group_state(
    pg_client: &tokio_postgres::Client,
    group_id: &str,
    state: GroupState,
) -> Result<(), tokio_postgres::Error> {
    pg_client
        .execute(
            r#"UPDATE "Group" SET "state" = $1 WHERE "id" = $2"#,
            &[&state, &group_id],
        )
        .await?;

    Ok(())
}

/// Upsert a group and return the group id
pub async fn upsert_group(
    pg_client: &tokio_postgres::Client,
    group: Group,
) -> Result<String, tokio_postgres::Error> {
    let group_contract_inputs: Vec<i32> = group
        .contract_inputs
        .iter()
        .map(|contract| contract.id as i32)
        .collect();

    // Upsert the group object
    let result = pg_client
        .query_one(
            r#"
            INSERT INTO "Group" ("id", "displayName", "typeId", "contractInputs", "score", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT ("id", "typeId", "contractInputs") DO UPDATE SET "displayName" = $2, "score" = $5, "updatedAt" = NOW()
            RETURNING id
        "#,
            &[&group.id, &group.name, &group.group_type, &group_contract_inputs, &group.score],
        )
        .await?;

    // Return the group id
    Ok(result.get(0))
}

/// Get all groups from the database
pub async fn get_groups(pg_client: &tokio_postgres::Client) -> Vec<Group> {
    // Get all groups from the storage
    let result = pg_client
        .query(
            r#"SELECT "id", "displayName", "typeId", "contractInputs", "score", "state" FROM "Group" where "contractInputs" is not null AND "state" = 'Recordable' "#,
            &[],
        )
        .await
        .unwrap();

    // Get all contracts from storage
    let contracts = get_contracts(pg_client).await;

    let groups = result
        .iter()
        .map(|row| {
            let group_id: String = row.get("id");
            let group_name: String = row.get("displayName");
            let group_type: GroupType = row.get("typeId");
            let contract_inputs: Vec<i32> = row.get("contractInputs");
            let score: i64 = row.get("score");

            // Convert the contract inputs to Contract struct
            let contract_inputs = contract_inputs
                .iter()
                .map(|contract_id| {
                    let contract = contracts
                        .iter()
                        .find(|contract| contract.id == *contract_id as u16);

                    match contract {
                        Some(contract) => contract.to_owned(),
                        None => panic!(
                            "Contract id {} specified in group not found in the database",
                            contract_id
                        ),
                    }
                })
                .collect();

            Group {
                id: group_id,
                name: group_name,
                group_type,
                contract_inputs,
                score,
            }
        })
        .collect::<Vec<Group>>();

    if is_prod() {
        groups
    } else {
        // Only return a selected few
        groups
            .iter()
            .filter(|group| PREVIEW_GROUP_IDS.contains(&group.id.as_str()))
            .cloned()
            .collect()
    }
}

pub struct GroupWithMembers {
    pub display_name: String,
    pub tree_proto_buf: Vec<u8>,
    pub bloom_filter: Vec<u8>,
    pub bloom_sip_keys: Vec<Vec<u8>>,
    pub bloom_num_bits: u32,
    pub bloom_num_hashes: u32,
    pub block_number: BlockNum,
}

/// Get a group by its id
pub async fn get_group_with_members(
    group_id: &str,
    pg_client: &tokio_postgres::Client,
) -> Result<GroupWithMembers, crate::Error> {
    let result = pg_client
        .query_one(
            r#"SELECT
                "Group"."displayName",
                "MerkleTree"."treeProtoBuf",
                "MerkleTree"."bloomFilter",
                "MerkleTree"."bloomSipKeys",
                "MerkleTree"."bloomNumBits",
                "MerkleTree"."bloomNumHashes",
                "MerkleTree"."blockNumber"
            FROM
                "Group"
                LEFT JOIN "MerkleTree" ON "MerkleTree"."groupId" = "Group".id
            WHERE
                "Group".id = $1
            ORDER BY
                "MerkleTree"."blockNumber" DESC
            LIMIT 1 "#,
            &[&group_id],
        )
        .await?;

    let group_name: String = result.get("displayName");
    let tree_proto_buf: Vec<u8> = result.get("treeProtoBuf");
    let bloom_filter: Vec<u8> = result.get("bloomFilter");
    let bloom_sip_keys: Vec<Vec<u8>> = result.get("bloomSipKeys");
    let bloom_num_bits: i32 = result.get("bloomNumBits");
    let bloom_num_hashes: i32 = result.get("bloomNumHashes");
    let block_number: i64 = result.get("blockNumber");

    Ok(GroupWithMembers {
        display_name: group_name,
        tree_proto_buf,
        bloom_filter,
        bloom_sip_keys,
        bloom_num_bits: bloom_num_bits as u32,
        bloom_num_hashes: bloom_num_hashes as u32,
        block_number: block_number as BlockNum,
    })
}
