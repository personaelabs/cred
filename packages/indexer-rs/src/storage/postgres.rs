use crate::storage::{Contract, GroupMerkleTree, GroupUpsertData, Storage};
use tokio_postgres::Error;

use super::{Group, GroupMerkleTreeWithProofs};

pub struct PostgresStorage {
    client: tokio_postgres::Client,
}

impl PostgresStorage {
    pub fn new(client: tokio_postgres::Client) -> Self {
        PostgresStorage { client }
    }
}

impl Storage for PostgresStorage {
    type ErrorType = Error;

    async fn get_group_by_handle(&self, handle: &str) -> Result<Option<Group>, Error> {
        let result = self
            .client
            .query_one(r#"SELECT * FROM "Group" WHERE "handle" = $1"#, &[&handle])
            .await;

        if result.is_err() {
            return Ok(None);
        }

        let row = result.unwrap();

        Ok(Some(Group {
            id: row.get("id"),
            handle: row.get("handle"),
            display_name: row.get("displayName"),
        }))
    }

    async fn get_contracts(&self) -> Result<Vec<Contract>, Error> {
        let result = self
            .client
            .query(r#"SELECT * FROM "Contract" ORDER BY "id" ASC"#, &[])
            //  .query(r#"SELECT * FROM "Contract" where "id" = 2"#, &[])
            .await?;

        // Convert the result into a Vec<Contract>
        let contracts = result
            .iter()
            .map(|row| Contract {
                id: row.get("id"),
                name: row.get("name"),
                symbol: row.get("symbol"),
                target_groups: row.get("targetGroups"),
            })
            .collect();

        Ok(contracts)
    }

    async fn update_group_merkle_tree(&self, tree: GroupMerkleTree) -> Result<(), Error> {
        self.client
            .execute(
                r#"UPDATE "MerkleTree" SET "blockNumber" = $1 WHERE "groupId" = $2 AND "merkleRoot" = $3"#,
                &[&tree.block_number, &tree.group_id, &tree.merkle_root],
            )
            .await?;

        Ok(())
    }

    async fn create_group_merkle_tree(
        &self,
        tree: GroupMerkleTreeWithProofs,
    ) -> Result<i32, Error> {
        let result=        self.client
            .query_one(
                r#"INSERT INTO "MerkleTree" ("merkleRoot", "groupId", "blockNumber", "merkleProofs", "updatedAt") VALUES($1, $2, $3, $4, NOW()) RETURNING "id""#,
                &[&tree.merkle_root, &tree.group_id, &tree.block_number, &tree.proofs],
            )
            .await?;

        let id: i32 = result.get("id");

        // Delete all other trees for this group
        self.client
            .query(
                r#"UPDATE "MerkleTree" SET "merkleProofs" = NULL WHERE "groupId" = $1 and id != $2"#,
                &[&tree.group_id, &id],
            )
            .await?;

        Ok(id)
    }

    async fn get_tree_by_root_and_group(
        &self,
        merkle_root: &str,
        group_id: i32,
    ) -> Result<Option<GroupMerkleTree>, Error> {
        let result = self
            .client
            .query_one(
                r#"SELECT * FROM "MerkleTree" WHERE "groupId" = $1 AND "merkleRoot" = $2"#,
                &[&group_id, &merkle_root],
            )
            .await;

        if result.is_err() {
            return Ok(None);
        }

        let row = result.unwrap();

        Ok(Some(GroupMerkleTree {
            merkle_root: row.get("merkleRoot"),
            group_id: row.get("groupId"),
            block_number: row.get::<_, i64>("blockNumber"),
        }))
    }

    async fn get_latest_group_merkle_tree(
        &self,
        group_id: i32,
    ) -> Result<Option<GroupMerkleTree>, Error> {
        let result = self
            .client
            .query_one(
                r#"SELECT * FROM "MerkleTree" WHERE "groupId" = $1 ORDER BY "blockNumber" DESC LIMIT 1"#,
                &[&group_id],
            )
            .await;

        if result.is_err() {
            return Ok(None);
        }

        let row = result.unwrap();

        Ok(Some(GroupMerkleTree {
            merkle_root: row.get("merkleRoot"),
            group_id: row.get("groupId"),
            block_number: row.get::<_, i64>("blockNumber"),
        }))
    }

    async fn upsert_group(&self, handle: String, data: GroupUpsertData) -> Result<(), Error> {
        self.client
            .execute(
                r#"INSERT INTO "Group" ("handle", "displayName", "updatedAt")
                        VALUES($1, $2, NOW()) ON CONFLICT ("handle")
                        DO
                        UPDATE
                        SET
                "displayName" = $2,
                "updatedAt" = NOW()"#,
                &[&handle, &data.display_name],
            )
            .await?;

        Ok(())
    }
}
