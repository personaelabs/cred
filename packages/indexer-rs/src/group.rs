use crate::{
    contract::{get_contracts, Contract},
    utils::get_group_id,
    GroupId, GroupState, GroupType,
};

#[derive(Debug, Clone)]
pub struct Group {
    pub id: GroupId,
    pub name: String,
    pub score: i64,
    pub group_type: GroupType,
    pub contract_inputs: Vec<Contract>,
}

impl Group {
    pub fn new(
        name: String,
        group_type: GroupType,
        contract_inputs: Vec<Contract>,
        score: i64,
    ) -> Self {
        let contract_addresses = contract_inputs
            .iter()
            .map(|contract| contract.address.clone())
            .collect::<Vec<String>>();

        let group_id = get_group_id(group_type, &contract_addresses);

        Group {
            id: group_id,
            name,
            group_type,
            contract_inputs,
            score,
        }
    }
}

/// Update the state of a group
pub async fn update_group_state(
    pg_client: &tokio_postgres::Client,
    group_id: &str,
    state: GroupState,
) -> Result<(), tokio_postgres::Error> {
    pg_client
        .execute(
            r#"UPDATE "Group" SET "state" = $1 WHERE "id" = $2"#,
            &[&state, &group_id],
        )
        .await?;

    Ok(())
}

/// Upsert a group and return the group id
pub async fn upsert_group(
    pg_client: &tokio_postgres::Client,
    group: Group,
) -> Result<String, tokio_postgres::Error> {
    let group_contract_inputs: Vec<i32> = group
        .contract_inputs
        .iter()
        .map(|contract| contract.id as i32)
        .collect();

    // Upsert the group object
    let result = pg_client
        .query_one(
            r#"
            INSERT INTO "Group" ("id", "displayName", "typeId", "contractInputs", "score", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT ("id", "typeId", "contractInputs") DO UPDATE SET "displayName" = $2, "score" = $5, "updatedAt" = NOW()
            RETURNING id
        "#,
            &[&group.id, &group.name, &group.group_type, &group_contract_inputs, &group.score],
        )
        .await?;

    // Return the group id
    Ok(result.get(0))
}

/// Get all groups from the database
pub async fn get_groups(pg_client: &tokio_postgres::Client) -> Vec<Group> {
    // Get all groups from the storage
    let result = pg_client
        .query(
            r#"SELECT "id", "displayName", "typeId", "contractInputs", "score", "state" FROM "Group" where "contractInputs" is not null AND "state" != 'Unrecordable' "#,
            &[],
        )
        .await
        .unwrap();

    // Get all contracts from storage
    let contracts = get_contracts(pg_client).await;

    let groups = result
        .iter()
        .map(|row| {
            let group_id: String = row.get("id");
            let group_name: String = row.get("displayName");
            let group_type: GroupType = row.get("typeId");
            let contract_inputs: Vec<i32> = row.get("contractInputs");
            let score: i64 = row.get("score");

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

            Group {
                id: group_id,
                name: group_name,
                group_type,
                contract_inputs,
                score,
            }
        })
        .collect();

    groups
}
