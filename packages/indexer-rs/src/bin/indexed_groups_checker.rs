use alloy_json_abi::Function;
use indexer_rs::{
    contract::{get_contracts, Contract, ContractType},
    eth_rpc::EthRpcClient,
    group::Group,
    log_sync_engine::{ERC1155_TRANSFER_SINGLE_SIG, TRANSFER_EVENT_SIG},
    postgres::init_postgres,
    utils::{dotenv_config, get_tree_leaves},
    BlockNum, GroupId, GroupType,
};
use log::{error, info, warn};
use num_bigint::BigUint;
use rand::{seq::SliceRandom, thread_rng};
use serde_json::{json, Value};
use std::sync::Arc;

async fn get_random_group(
    pg_client: Arc<tokio_postgres::Client>,
    group_type: GroupType,
) -> Result<Group, tokio_postgres::Error> {
    // Choose a random group from the database
    let row = pg_client
        .query_one(
            r#"
            SELECT
                "id",
                "displayName",
                "typeId",
                "contractInputs"
            FROM
                "Group"
            WHERE
                "typeId" = $1 
            ORDER BY
                RANDOM()
            LIMIT 1;
            "#,
            &[&group_type],
        )
        .await?;

    // Get all contracts from storage
    let contracts = get_contracts(&pg_client).await;

    let group_id: String = row.get("id");
    let group_name: String = row.get("displayName");
    let group_type: GroupType = row.get("typeId");
    let contract_inputs: Vec<i32> = row.get("contractInputs");

    // Convert the contract inputs to Contract struct
    let contract_inputs = contract_inputs
        .iter()
        .map(|contract_id| {
            let contract = contracts
                .iter()
                .find(|contract| contract.id == *contract_id as u16);

            match contract {
                Some(contract) => contract.to_owned(),
                None => panic!(
                    "Contract id {} specified in group not found in the database",
                    contract_id
                ),
            }
        })
        .collect();

    Ok(Group {
        id: group_id,
        name: group_name,
        group_type,
        contract_inputs,
    })
}

async fn get_group_latest_tree_id(
    pg_client: Arc<tokio_postgres::Client>,
    group_id: GroupId,
) -> Result<Option<(i32, BlockNum)>, tokio_postgres::Error> {
    // Get the latest Merkle tree from the database
    let result = pg_client
        .query(
            r#"
            SELECT
                "id",
                "blockNumber"
            FROM
                "MerkleTree"
            WHERE
                "groupId" = $1
            ORDER BY
                "blockNumber" DESC
            LIMIT 1;
            "#,
            &[&group_id],
        )
        .await?;

    if result.is_empty() {
        return Ok(None);
    }

    let row = &result[0];

    let tree_id: i32 = row.get("id");
    let block_number: i64 = row.get("blockNumber");

    Ok(Some((tree_id, block_number as BlockNum)))
}

async fn test_all_holders(pg_client: Arc<tokio_postgres::Client>, eth_client: Arc<EthRpcClient>) {
    // Choose a random group from the database
    let group = get_random_group(pg_client.clone(), GroupType::AllHolders)
        .await
        .unwrap();

    // Get the latest Merkle tree of the group from the database
    let latest_tree = get_group_latest_tree_id(pg_client.clone(), group.id)
        .await
        .unwrap();

    if latest_tree.is_none() {
        info!(
            "AllHolders: No Merkle tree found for group {:?}",
            group.name
        );
        return;
    }

    let (tree_id, tree_block_num) = latest_tree.unwrap();

    // Get the leaves of the tree from the database
    let members = get_tree_leaves(&pg_client, tree_id).await.unwrap();

    // Choose a 5 random members to check
    let mut rng = thread_rng();
    let members_to_check = members.choose_multiple(&mut rng, 5);

    let contract = group.contract_inputs[0].clone();
    let contract_address = contract.address;

    for member in members_to_check {
        let member_padded = format!("0x{:0>width$}", member, width = 64);

        let topics = match contract.contract_type {
            ContractType::ERC721 => json!([TRANSFER_EVENT_SIG, Value::Null, member_padded]),
            ContractType::ERC1155 => json!([
                ERC1155_TRANSFER_SINGLE_SIG,
                Value::Null,
                Value::Null,
                member_padded
            ]),
            _ => panic!("Unexpected contract type"),
        };

        let params = json!({
            "address": contract_address,
            "topics": topics,
            "fromBlock": "earliest",
            "toBlock": format!("0x{:x}", tree_block_num),
        });

        let result = eth_client.get_logs(contract.chain, &params).await.unwrap();

        let result = result["result"].as_array().unwrap();

        if result.is_empty() {
            error!(
                "AllHolders: Address {} has not received a transfer {}",
                member, tree_id
            );
        } else {
            info!(
                "{} check passed for 0x{} at block {}",
                group.name, member, tree_block_num
            );
        }
    }
}

async fn get_balance_at_block(
    eth_client: Arc<EthRpcClient>,
    contract: &Contract,
    address: &str,
    block_number: BlockNum,
) -> BigUint {
    let balance_of_selector = hex::encode(
        Function::parse("balanceOf(address _owner)")
            .unwrap()
            .selector()
            .0,
    );

    let args = hex::decode(format!("{:0>width$}", address, width = 64)).unwrap();

    let balance_at_block = eth_client
        .eth_call(
            contract.chain,
            &contract.address,
            &balance_of_selector,
            &args,
            block_number,
        )
        .await
        .unwrap();

    BigUint::from_bytes_be(
        &hex::decode(
            balance_at_block["result"]
                .as_str()
                .unwrap()
                .trim_start_matches("0x"),
        )
        .unwrap(),
    )
}

async fn get_total_supply_at_block(
    eth_client: Arc<EthRpcClient>,
    contract: &Contract,
    block_number: BlockNum,
) -> BigUint {
    let total_supply_selector = hex::encode(Function::parse("totalSupply()").unwrap().selector().0);

    let total_supply_at_block = eth_client
        .eth_call(
            contract.chain,
            &contract.address,
            &total_supply_selector,
            &[],
            block_number,
        )
        .await
        .unwrap();

    BigUint::from_bytes_be(
        &hex::decode(
            total_supply_at_block["result"]
                .as_str()
                .unwrap()
                .trim_start_matches("0x"),
        )
        .unwrap(),
    )
}

async fn test_whale(pg_client: Arc<tokio_postgres::Client>, eth_client: Arc<EthRpcClient>) {
    // Choose a random group from the database
    let group = get_random_group(pg_client.clone(), GroupType::Whale)
        .await
        .unwrap();

    // Get the latest Merkle tree of the group from the database
    let latest_tree = get_group_latest_tree_id(pg_client.clone(), group.id)
        .await
        .unwrap();

    if latest_tree.is_none() {
        info!(
            "AllHolders: No Merkle tree found for group {:?}",
            group.name
        );
        return;
    }

    let (tree_id, tree_block_num) = latest_tree.unwrap();

    // Get the leaves of the tree from the database
    let members = get_tree_leaves(&pg_client, tree_id).await.unwrap();

    // Choose a 5 random members to check
    let mut rng = thread_rng();
    let members_to_check = members.choose_multiple(&mut rng, 5);

    let contract = group.contract_inputs[0].clone();

    // For each member,
    // check if the balance of the address is greater than 0.1% of the total supply
    // at some point
    for member in members_to_check {
        // Get logs where the balance of the address increases
        let params = json!({
            "address": contract.address.clone(),
            "topics": [
                TRANSFER_EVENT_SIG,
                Value::Null,
                format!("0x{:0>width$}", member, width = 64),
            ],
            "fromBlock": "earliest",
            "toBlock": format!("0x{:x}", tree_block_num),
        });

        let result = eth_client.get_logs(contract.chain, &params).await.unwrap();

        let block_nums = result["result"]
            .as_array()
            .unwrap()
            .iter()
            .map(|log| {
                let block_num = log["blockNumber"].as_str().unwrap();
                u64::from_str_radix(block_num.trim_start_matches("0x"), 16).unwrap()
            })
            .collect::<Vec<BlockNum>>();

        // Make sure that the address has received a transfer before

        let mut is_whale = false;

        // Check the balance of the address at each block
        // where the balance increased
        for block_num in &block_nums {
            // Get the balance of the address at the block
            let balance =
                get_balance_at_block(eth_client.clone(), &contract, member, block_num + 1).await;

            // Get the total supply at the block
            let total_supply =
                get_total_supply_at_block(eth_client.clone(), &contract, block_num + 1).await;

            let whale_threshold = total_supply.clone() / BigUint::from(1000u32);

            if balance >= whale_threshold {
                // We found a block where the address had a balance greater than 0.1% of the total supply
                is_whale = true;
                break;
            }
        }

        if !is_whale || block_nums.is_empty() {
            warn!(
                "{} Whale: Address {} is not a whale {}",
                contract.name, member, tree_id
            );
        } else {
            info!(
                "{} check passed for 0x{} at block {}",
                group.name, member, tree_block_num
            );
        }
    }
}

async fn test_early_holders(pg_client: Arc<tokio_postgres::Client>, eth_client: Arc<EthRpcClient>) {
    // Choose a random group from the database
    let group = get_random_group(pg_client.clone(), GroupType::Whale)
        .await
        .unwrap();

    // Get the latest Merkle tree of the group from the database
    let latest_tree = get_group_latest_tree_id(pg_client.clone(), group.id)
        .await
        .unwrap();

    if latest_tree.is_none() {
        info!(
            "AllHolders: No Merkle tree found for group {:?}",
            group.name
        );
        return;
    }

    let (tree_id, tree_block_num) = latest_tree.unwrap();

    // Get the leaves of the tree from the database
    let members = get_tree_leaves(&pg_client, tree_id).await.unwrap();

    // Choose a 5 random members to check
    let mut rng = thread_rng();
    let members_to_check = members.choose_multiple(&mut rng, 5);

    let contract = group.contract_inputs[0].clone();

    // For each member,
    // check that they have received a transfer before

    for member in members_to_check {
        // Get logs where the balance of the address increases
        let params = json!({
            "address": contract.address.clone(),
            "topics": [
                TRANSFER_EVENT_SIG,
                Value::Null,
                format!("0x{:0>width$}", member, width = 64),
            ],
            "fromBlock": "earliest",
            "toBlock": format!("0x{:x}", tree_block_num),
        });

        let result = eth_client.get_logs(contract.chain, &params).await.unwrap();

        let result = result["result"].as_array().unwrap();

        if result.is_empty() {
            error!(
                "EarlyHolders: Address {} has not received a transfer {}",
                member, tree_id
            );
        } else {
            info!(
                "{} check passed for 0x{} at block {}",
                group.name, member, tree_block_num
            );
        }
    }
}

#[tokio::main]
async fn main() {
    dotenv_config();
    let pg_client = init_postgres().await;
    let eth_client = Arc::new(EthRpcClient::new());

    loop {
        test_all_holders(pg_client.clone(), eth_client.clone()).await;
        test_whale(pg_client.clone(), eth_client.clone()).await;
        test_early_holders(pg_client.clone(), eth_client.clone()).await;

        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
    }
}
