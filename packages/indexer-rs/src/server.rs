use std::sync::Arc;

use crate::{address_groups::AddressGroups, postgres::init_postgres, GroupType, ROCKSDB_PATH};
use jsonrpc_http_server::jsonrpc_core::*;
use jsonrpc_http_server::*;
use log::info;
use rocksdb::{Options, DB};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GroupData {
    pub id: String,
    pub display_name: String,
    pub type_id: GroupType,
}

pub type GetGroupsReturnType = Vec<GroupData>;

pub async fn get_groups(group_ids: &Vec<String>, pg_client: &tokio_postgres::Client) -> Vec<GroupData> {
    let rows = pg_client
        .query(
            r#"SELECT "id", "displayName", "typeId" FROM "Group" where "state" = 'Recordable' AND "id" = ANY($1)"#,
            &[&group_ids],
        )
        .await
        .unwrap();

    rows.iter()
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
        .collect::<Vec<GroupData>>()
}

pub async fn start_server() {
    let db_options = Options::default();
    let rocksdb_conn = Arc::new(DB::open_for_read_only(&db_options, ROCKSDB_PATH, true).unwrap());

    let pg_client = init_postgres().await;

    let mut io = IoHandler::default();

    io.add_method("getAddressGroups", move |params: Params| {
        let rocksdb_conn = rocksdb_conn.clone();
        let pg_client = pg_client.clone();

        async move {
            let params: Vec<String> = params.parse().unwrap();

            if params.len() != 1 {
                return Err(Error::invalid_params("Expected 1 parameter"));
            }

            let address = params[0].clone();
            let address = hex::decode(address.trim_start_matches("0x")).unwrap();

            if address.len() != 20 {
                return Err(Error::invalid_params("Invalid address"));
            }

            let address_groups = AddressGroups::get(address.try_into().unwrap(), rocksdb_conn);

            let group_ids: GetGroupsReturnType = match address_groups {
                Some(address_groups) => {
                    let group_ids = address_groups
                        .group_ids
                        .iter()
                        .map(|id| hex::encode(id))
                        .collect::<Vec<String>>();

                    let groups = get_groups(&group_ids, &pg_client).await;

                    groups
                }
                None => vec![],
            };

            Ok(json!(group_ids))
        }
    });

    let port = std::env::var("PORT").unwrap_or_else(|_| "3030".to_string());

    let addr = format!("0.0.0.0:{}", port);
    info!("Starting server at {}", addr);

    let server = ServerBuilder::new(io)
        .cors(DomainsValidation::AllowOnly(vec![
            AccessControlAllowOrigin::Any,
        ]))
        .start_http(&addr.parse().unwrap())
        .expect("Unable to start RPC server");

    server.wait();
}
