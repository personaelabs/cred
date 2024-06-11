use super::GroupData;
use jsonrpc_http_server::jsonrpc_core::{Error as JsonRpcError, Params, Value};
use serde_json::json;

pub type GetCredddReturnType = GroupData;

pub async fn get_group_latest_merkle_tree(
    params: Params,
    pg_client: &tokio_postgres::Client,
) -> Result<Value, JsonRpcError> {
    let params: Vec<String> = params.parse().unwrap();

    if params.len() != 1 {
        return Err(JsonRpcError::invalid_params("Expected 1 parameter"));
    }

    let group_id = params[0].clone();

    let result = pg_client
        .query(
            r#"
            SELECT
                "treeProtoBuf"
            FROM
                "MerkleTree"
            WHERE
                "groupId" = $1
            ORDER BY
                "blockNumber" DESC
            LIMIT 1
            "#,
            &[&group_id],
        )
        .await;

    if result.is_err() {
        return Err(JsonRpcError::internal_error());
    }

    let rows = result.unwrap();

    if rows.len() == 0 {
        return Err(JsonRpcError::invalid_params(
            "No Merkle tree found for the given group id",
        ));
    }

    let row = rows.get(0).unwrap();

    let merkle_tree_protobuf: Vec<u8> = row.get("treeProtoBuf");

    Ok(json!(merkle_tree_protobuf))
}
