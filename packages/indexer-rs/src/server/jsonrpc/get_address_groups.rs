use super::GroupData;
use crate::{address_groups::AddressGroups, GroupType};
use jsonrpc_http_server::jsonrpc_core::{Error as JsonRpcError, Params, Value};
use serde_json::json;
use std::sync::Arc;

pub type GetGroupsReturnType = Vec<GroupData>;

async fn get_groups(
    group_ids: &Vec<String>,
    pg_client: &tokio_postgres::Client,
) -> Result<Vec<GroupData>, tokio_postgres::Error> {
    let rows = pg_client
        .query(
            r#"SELECT "id", "displayName", "typeId" FROM "Group" where "state" = 'Recordable' AND "id" = ANY($1)"#,
            &[&group_ids],
        )
        .await?;

    Ok(rows
        .iter()
        .map(|row| {
            let group_id: String = row.get("id");
            let group_name: String = row.get("displayName");
            let group_type: GroupType = row.get("typeId");

            GroupData {
                id: group_id,
                display_name: group_name,
                type_id: group_type,
            }
        })
        .collect::<Vec<GroupData>>())
}

pub async fn get_address_groups(
    params: Params,
    pg_client: &tokio_postgres::Client,
    rocksdb_conn: Arc<rocksdb::DB>,
) -> Result<Value, JsonRpcError> {
    let params: Vec<String> = params.parse().unwrap();

    if params.len() != 1 {
        return Err(JsonRpcError::invalid_params("Expected 1 parameter"));
    }

    let address = params[0].clone();
    let address = hex::decode(address.trim_start_matches("0x")).unwrap();

    if address.len() != 20 {
        return Err(JsonRpcError::invalid_params("Invalid address"));
    }

    let address_groups = AddressGroups::get(address.try_into().unwrap(), rocksdb_conn);

    let group_ids: Result<GetGroupsReturnType, tokio_postgres::Error> = match address_groups {
        Some(address_groups) => {
            let group_ids = address_groups
                .group_ids
                .iter()
                .map(|id| hex::encode(id))
                .collect::<Vec<String>>();

            get_groups(&group_ids, &pg_client).await
        }
        None => Ok(vec![]),
    };

    match group_ids {
        Ok(group_ids) => Ok(json!(group_ids)),
        Err(_) => return Err(JsonRpcError::internal_error()),
    }
}
