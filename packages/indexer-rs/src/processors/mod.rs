use crate::storage::{Group, Storage};
use crate::TransferEvent;

pub mod early_holders;
pub mod whales;

pub trait ProcessorLike<S: Storage> {
    fn group_handle(&self) -> String;

    async fn get_group(&self, storage: &S) -> Result<Group, S::ErrorType> {
        let group = storage.get_group_by_handle(&self.group_handle()).await?;

        if group.is_none() {
            panic!("Group not found");
        }

        Ok(group.unwrap())
    }

    async fn latest_tree_block_num(&self, storage: &S) -> Result<i64, S::ErrorType> {
        let group = self.get_group(storage).await?;
        let group_id = group.id;

        // Get the latest tree of the group
        let tree = storage.get_latest_group_merkle_tree(group_id).await?;

        if let Some(tree) = tree {
            Ok(tree.block_number)
        } else {
            Ok(0)
        }
    }

    fn process_log(&mut self, log: &TransferEvent) -> Result<(), std::io::Error>;
    async fn index_tree(&self, storage: &S, block_number: i64) -> Result<(), S::ErrorType>;
}
