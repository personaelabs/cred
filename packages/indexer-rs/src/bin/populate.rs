use std::env;
use tokio_postgres::{Client, Error, NoTls};

const DEV_FIDS: [i32; 3] = [54, 12783, 20559];

async fn populate() -> Result<(), Error> {
    let is_pull_request = env::var("IS_PULL_REQUEST").unwrap_or("false".to_string());
    let is_render = env::var("RENDER").unwrap_or("false".to_string());

    if is_render == "false" || is_pull_request == "true" {
        dotenv::dotenv().ok();

        let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

        // Connect to the database.
        let (client, connection) = tokio_postgres::connect(&database_url, NoTls).await?;

        // The connection object performs the actual communication with the database,
        // so spawn it off to run on its own.
        tokio::spawn(async move {
            if let Err(e) = connection.await {
                eprintln!("connection error: {}", e);
            }
        });

        let result = client
            .query(r#"SELECT * FROM "Contract" ORDER BY "id" ASC "#, &[])
            .await?;

        for row in result {
            let id: i32 = row.get(0);
            let name: String = row.get(1);
            println!("Found contract: {} with id: {}", name, id);
        }

        let handle = "dev0".to_string();
        let display_name = "Dev 0".to_string();
        let target_group = "dev".to_string();

        let dev_group = client
            .query(
                r#"INSERT INTO "Group" ("handle", "display_name", "type") VALUES ($1, $2, $3) ON CONFLICT ("handle") DO UPDATE SET "display_name" = $2, "type" = $3 RETURNING *"#,
                &[&handle, &display_name, &target_group],
            )
            .await?;

        // Upsert a dummy tree

        let merkle_root = "0x0".to_string();

        /*
        let tree = client
            .execute(
                r#"INSERT INTO "MerkleTree" ("merkle_root", "group_id", "block_number") VALUES ($1, $2, $3) ON CONFLICT ("merkle_root", "group_id") DO UPDATE SET "block_number" = $3 RETURNING *"#,
                &[&merkle_root, &dev_group[0].get(0), 0],
            )
            .await?;

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
         */
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    populate().await?;

    Ok(())
}
