use indexer_rs::prisma::{
    group::{self},
    merkle_tree, PrismaClient,
};
use prisma_client_rust::QueryError;
use std::env;

const DEV_FIDS: [i32; 3] = [54, 12783, 20559];

async fn populate() -> Result<(), QueryError> {
    let is_pull_request = env::var("IS_PULL_REQUEST").unwrap_or("false".to_string());
    let is_render = env::var("RENDER").unwrap_or("false".to_string());

    let client = PrismaClient::_builder().build().await;
    let client = client.unwrap();

    if is_render == "false" || is_pull_request == "true" {
        let handle = "dev0".to_string();
        let display_name = "Dev 0".to_string();
        let target_group = "dev".to_string();

        let dev_group = client
            .group()
            .upsert(
                group::handle::equals(handle.clone()),
                group::create(
                    handle,
                    display_name.clone(),
                    vec![
                        group::display_name::set(display_name.clone()),
                        group::r#type::set(Some(target_group.clone())),
                    ],
                ),
                vec![
                    group::display_name::set(display_name.clone()),
                    group::r#type::set(Some(target_group)),
                ],
            )
            .exec()
            .await?;

        let merkle_root = "0x0".to_string();

        // Upsert a dummy tree
        let tree = client
            .merkle_tree()
            .upsert(
                merkle_tree::UniqueWhereParam::MerkleRootGroupIdBlockNumberEquals(
                    merkle_root.clone(),
                    dev_group.id,
                    0,
                ),
                (merkle_root, group::id::equals(dev_group.id), 0, vec![]),
                vec![],
            )
            .exec()
            .await?;

        // Create some dummy FID attestations
        client
            .fid_attestation()
            .create_many(
                DEV_FIDS
                    .iter()
                    .map(|fid| (*fid, vec![], vec![], tree.id, vec![]))
                    .collect(),
            )
            .exec()
            .await?;
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), QueryError> {
    populate().await?;

    Ok(())
}
