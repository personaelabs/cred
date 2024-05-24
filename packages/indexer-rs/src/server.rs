use std::sync::Arc;

use crate::{address_groups::AddressGroups, ROCKSDB_PATH};
use jsonrpc_http_server::jsonrpc_core::*;
use jsonrpc_http_server::*;
use log::info;
use rocksdb::{Options, DB};
use serde_json::json;

pub type GetGroupsReturnType = Vec<String>;

pub async fn start_server() {
    let db_options = Options::default();
    let rocksdb_conn = Arc::new(DB::open_for_read_only(&db_options, ROCKSDB_PATH, true).unwrap());

    let mut io = IoHandler::default();

    io.add_method("getAddressGroups", move |params: Params| {
        let rocksdb_conn = rocksdb_conn.clone();

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
                Some(address_groups) => address_groups
                    .group_ids
                    .iter()
                    .map(|id| hex::encode(id))
                    .collect::<Vec<String>>(),
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
            AccessControlAllowOrigin::Null,
        ]))
        .start_http(&addr.parse().unwrap())
        .expect("Unable to start RPC server");

    server.wait();
}
