use super::{GroupData, MerkleTree};
use crate::GroupType;
use jsonrpc_http_server::jsonrpc_core::{Error as JsonRpcError, Params, Value};
use serde_json::json;

pub type GetCredddReturnType = GroupData;

pub async fn get_latest_merkle_trees(
    params: Params,
    pg_client: &tokio_postgres::Client,
) -> Result<Value, JsonRpcError> {
    let params: Vec<String> = params.parse().unwrap();

    if params.len() != 0 {
        return Err(JsonRpcError::invalid_params("Expected no parameter"));
    }

    let result = pg_client
        .query(
            r#"
            SELECT DISTINCT ON ("Group".id)
                "MerkleTree".id,
                "bloomFilter",
                "bloomNumBits",
                "bloomNumHashes",
                "bloomSipKeys",
                "Group"."displayName" as "groupName",
                "Group".score as "groupScore",
                "Group"."typeId" as "groupType",
                "Group".id as "groupId"
            FROM
                "MerkleTree"
                LEFT JOIN "Group" ON "MerkleTree"."groupId" = "Group".id
                WHERE "MerkleTree"."bloomFilter" IS NOT NULL
                AND "Group".state = 'Recordable'
            ORDER BY
                "Group".id,
                "MerkleTree"."blockNumber" DESC
            "#,
            &[],
        )
        .await;

    if result.is_err() {
        return Err(JsonRpcError::internal_error());
    }

    let rows = result.unwrap();

    let merkle_trees = rows
        .iter()
        .map(|row| {
            let merkle_tree_id: i32 = row.get("id");
            let bloom_filter: Vec<u8> = row.get("bloomFilter");
            let bloom_num_bits: i32 = row.get("bloomNumBits");
            let bloom_num_hashes: i32 = row.get("bloomNumHashes");
            let bloom_sip_keys: Vec<Vec<u8>> = row.get("bloomSipKeys");
            let group_name: String = row.get("groupName");
            let group_type: GroupType = row.get("groupType");
            let group_id: String = row.get("groupId");

            let group_data = GroupData {
                id: group_id,
                display_name: group_name,
                type_id: group_type,
            };

            let merkle_tree = MerkleTree {
                id: merkle_tree_id,
                bloom_filter,
                bloom_sip_keys,
                bloom_num_hashes,
                bloom_num_bits,
                group: group_data,
            };

            merkle_tree
        })
        .collect::<Vec<MerkleTree>>();

    Ok(json!(merkle_trees))
}
