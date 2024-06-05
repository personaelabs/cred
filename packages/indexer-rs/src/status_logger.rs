use log::{error, info};
use std::sync::Arc;

use crate::{group::get_all_groups, BlockNum, Error};

const STATUS_CHECK_INTERVAL_SECS: u64 = 300; // 5 minutes

async fn get_group_block_height(
    group_id: String,
    pg_client: &tokio_postgres::Client,
) -> Result<Option<BlockNum>, Error> {
    let statement = r#"
        SELECT
            "blockNumber"
        FROM
            "MerkleTree"
        WHERE
            "groupId" = $1
        ORDER BY
            "blockNumber" DESC
        LIMIT 1
        "#;

    let result = pg_client.query(statement, &[&group_id]).await?;

    if result.len() == 0 {
        return Ok(None);
    } else {
        let block_number: i64 = result[0].get("blockNumber");
        Ok(Some(block_number as BlockNum))
    }
}

async fn log_group_block_heights(pg_client: Arc<tokio_postgres::Client>) -> Result<(), Error> {
    let groups = get_all_groups(&pg_client).await?;

    for group in groups {
        let block_num = get_group_block_height(group.id.clone(), &pg_client).await?;

        if let Some(block_num) = block_num {
            info!(
                "[STATUS] Group {} latest merkle tree block number: {}",
                group.id, block_num
            );
        } else {
            error!("[STATUS] Group {} has no merkle tree", group.id);
        }
    }

    Ok(())
}

pub async fn start_status_logger(pg_client: Arc<tokio_postgres::Client>) {
    loop {
        if let Err(e) = log_group_block_heights(pg_client.clone()).await {
            error!("[STATUS] Error logging group block heights: {:?}", e);
        }

        tokio::time::sleep(tokio::time::Duration::from_secs(STATUS_CHECK_INTERVAL_SECS)).await;
    }
}
