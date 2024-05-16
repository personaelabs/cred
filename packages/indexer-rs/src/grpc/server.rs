use super::group::group_data_server::GroupDataServer;
use super::group_data_service::GroupDataService;
use super::groups::groups_server::GroupsServer;
use super::groups_service::GroupsService;
use std::sync::Arc;
use tonic::transport::Server;

pub async fn start_grpc_server(pg_client: Arc<tokio_postgres::Client>) {
    // defining address for our service
    let port = std::env::var("PORT").unwrap_or("50051".to_string());
    let addr = format!("[::1]:{}", port).parse().unwrap();

    let group = GroupDataService::new(pg_client.clone());
    let groups = GroupsService::new(pg_client.clone());
    println!("Server listening on {}", addr);

    // adding our service to our server.
    Server::builder()
        .add_service(GroupDataServer::new(group))
        .add_service(GroupsServer::new(groups))
        .serve(addr)
        .await
        .unwrap();
}
