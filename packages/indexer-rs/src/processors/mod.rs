use crate::prisma;
use crate::tree::save_tree;
use crate::TransferEvent;
use num_bigint::BigUint;
use prisma::PrismaClient;
use prisma::{contract, group, merkle_tree};
use prisma_client_rust::queries::QueryError;
use prisma_client_rust::Direction;
use std::collections::{HashMap, HashSet};
use std::io::Error;
use std::io::ErrorKind;

pub mod early_holders;
pub mod whales;

pub trait ProcessorLike {
    fn group_handle(&self) -> String;

    async fn get_group(&self, prisma_client: &PrismaClient) -> Result<group::Data, QueryError> {
        let group = prisma_client
            .r#group()
            .find_unique(group::handle::equals(self.group_handle()))
            .exec()
            .await?;

        if group.is_none() {
            panic!("Group not found");
        }

        Ok(group.unwrap())
    }

    async fn latest_tree_block_num(&self, prisma_client: &PrismaClient) -> Result<u64, QueryError> {
        let group = self.get_group(prisma_client).await?;
        let group_id = group.id;

        // Get the latest tree of the group
        let tree = prisma_client
            .merkle_tree()
            .find_first(vec![merkle_tree::group_id::equals(group_id)])
            .order_by(merkle_tree::block_number::order(Direction::Desc))
            .exec()
            .await?;

        if tree.is_some() {
            Ok(tree.unwrap().block_number as u64)
        } else {
            Ok(0)
        }
    }

    fn process_log(&mut self, log: &TransferEvent) -> Result<(), Error>;
    async fn index_tree(
        &self,
        prisma_client: &PrismaClient,
        block_number: u64,
    ) -> Result<(), QueryError>;
}
