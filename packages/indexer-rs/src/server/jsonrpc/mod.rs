pub mod get_address_groups;
pub mod get_group_by_merkle_root;
pub mod get_group_merkle_tree;
use serde::{Deserialize, Serialize};

use crate::GroupType;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GroupData {
    pub id: String,
    pub display_name: String,
    pub type_id: GroupType,
}