use crate::{
    postgres::init_postgres,
    server::jsonrpc::{
        get_address_groups::get_address_groups, get_creddd::get_creddd,
        get_group_by_merkle_root::get_group_by_merkle_root,
        get_group_merkle_tree::get_group_merkle_tree, get_groups::get_groups,
    },
    ROCKSDB_PATH,
};
use jsonrpc_http_server::jsonrpc_core::*;
use jsonrpc_http_server::*;
use log::info;
use rocksdb::{Options, DB};
use std::sync::Arc;

pub async fn start_server() {
    let db_options = Options::default();
    let rocksdb_conn = Arc::new(DB::open_for_read_only(&db_options, ROCKSDB_PATH, true).unwrap());
    let pg_client = init_postgres().await;

    let mut io = IoHandler::default();

    let pg_client_moved = pg_client.clone();
    io.add_method("getAddressGroups", move |params: Params| {
        let rocksdb_conn = rocksdb_conn.clone();
        let pg_client_moved = pg_client_moved.clone();

        async move { get_address_groups(params, &pg_client_moved, rocksdb_conn).await }
    });

    let pg_client_moved = pg_client.clone();
    io.add_method("getGroupByMerkleRoot", move |params: Params| {
        let pg_client_moved = pg_client_moved.clone();

        async move { get_group_by_merkle_root(params, &pg_client_moved).await }
    });

    let pg_client_moved = pg_client.clone();
    io.add_method("getGroupMerkleTree", move |params: Params| {
        let pg_client_moved = pg_client_moved.clone();

        async move { get_group_merkle_tree(params, &pg_client_moved).await }
    });

    let pg_client_moved = pg_client.clone();
    io.add_method("getCreddd", move |params: Params| {
        let pg_client_moved = pg_client_moved.clone();

        async move { get_creddd(params, &pg_client_moved).await }
    });

    let pg_client_moved = pg_client.clone();
    io.add_method("getGroups", move |params: Params| {
        let pg_client_moved = pg_client_moved.clone();

        async move { get_groups(params, &pg_client_moved).await }
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
