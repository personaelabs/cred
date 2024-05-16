 pub(crate) mod group_data_service;
pub(crate) mod groups_service;
pub mod server;

pub(crate) mod group {
    tonic::include_proto!("group_data");
}

pub(crate) mod groups {
    tonic::include_proto!("groups");
}