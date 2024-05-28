use super::GroupData;
use crate::GroupType;
use jsonrpc_http_server::jsonrpc_core::*;
use serde_json::json;

pub type GetGroupByMerkleRootReturnType = GroupData;

pub async fn get_group_by_merkle_root(
    params: Params,
    pg_client: &tokio_postgres::Client,
) -> Result<Value> {
    let params: Vec<String> = params.parse().unwrap();

    if params.len() != 1 {
        return Err(Error::invalid_params("Expected 1 parameter"));
    }

    let merkle_root = params[0].clone();

    let rows = pg_client
        .query(
            r#"
            SELECT
                "Group".id,
                "Group"."displayName",
                "Group"."typeId"
            FROM
                "MerkleTree"
                LEFT JOIN "Group" ON "MerkleTree"."groupId" = "Group".id
            WHERE
                "MerkleTree"."merkleRoot" = $1
            "#,
            &[&merkle_root],
        )
        .await
        .unwrap();

    if rows.len() == 0 {
        return Err(Error::invalid_params(
            "No group found for the given Merkle root",
        ));
    }

    let row = rows.get(0).unwrap();

    let group_id: String = row.get("id");
    let group_name: String = row.get("displayName");
    let group_type: GroupType = row.get("typeId");

    let group_data = GroupData {
        id: group_id,
        display_name: group_name,
        type_id: group_type,
    };

    Ok(json!(group_data))
}
