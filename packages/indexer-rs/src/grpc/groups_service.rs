use super::groups::{groups_server::Groups, Group, GroupsRequest, GroupsResponse};
use crate::group::get_groups;
use std::sync::Arc;
use tonic::{Request, Response, Status};

pub struct GroupsService {
    pg_client: Arc<tokio_postgres::Client>,
}

impl GroupsService {
    pub fn new(pg_client: Arc<tokio_postgres::Client>) -> Self {
        Self { pg_client }
    }
}

#[tonic::async_trait]
impl Groups for GroupsService {
    async fn all(
        &self,
        _request: Request<GroupsRequest>,
    ) -> Result<Response<GroupsResponse>, Status> {
        let groups = get_groups(&self.pg_client).await;

        let group_response = GroupsResponse {
            groups: groups
                .into_iter()
                .map(|g| Group {
                    id: g.id,
                    display_name: g.name,
                })
                .collect(),
        };

        Ok(Response::new(group_response))
    }
}
