use super::GroupData;
use crate::{ GroupType};
use jsonrpc_http_server::jsonrpc_core::*;
use serde_json::json;

pub type GetCredddReturnType = GroupData;

pub async fn get_creddd(params: Params, pg_client: &tokio_postgres::Client) -> Result<Value> {
    let params: Vec<String> = params.parse().unwrap();

    if params.len() != 1 {
        return Err(Error::invalid_params("Expected 1 parameter"));
    }

    let creddd_id = params[0].clone();

    let rows = pg_client
        .query(
            r#"
            SELECT
                id,
                "displayName",
                "typeId"
            FROM
                "Group"
            WHERE
                "id" = $1
            "#,
            &[&creddd_id],
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
