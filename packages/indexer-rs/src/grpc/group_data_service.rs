use super::group::{group_data_server::GroupData, GroupDataRequest, GroupDataResponse};
use crate::group::{get_group_with_members};
use std::sync::Arc;
use tonic::{Request, Response, Status};

pub struct GroupDataService {
    pg_client: Arc<tokio_postgres::Client>,
}

impl GroupDataService {
    pub fn new(pg_client: Arc<tokio_postgres::Client>) -> Self {
        Self { pg_client }
    }
}

#[tonic::async_trait]
impl GroupData for GroupDataService {
    async fn get(
        &self,
        request: Request<GroupDataRequest>,
    ) -> Result<Response<GroupDataResponse>, Status> {
        let r = request.into_inner();

        let group = get_group_with_members(&r.id, &self.pg_client)
            .await
            .unwrap();

        let group_response = GroupDataResponse {
            display_name: group.display_name,
            latest_merkle_tree: group.tree_proto_buf,
            bloom_filter: group.bloom_filter,
            bloom_sip_keys: group.bloom_sip_keys,
            bloom_num_bits: group.bloom_num_bits,
            bloom_num_hashes: group.bloom_num_hashes,
            block_number: group.block_number,
        };

        Ok(Response::new(group_response))
    }
}
