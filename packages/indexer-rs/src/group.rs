use crate::{
    contract::{get_contracts, Contract},
    GroupType,
};

#[derive(Debug, Clone)]
pub struct Group {
    pub id: Option<i32>,
    pub name: String,
    pub group_type: GroupType,
    pub contract_inputs: Vec<Contract>,
}

/// Upsert a group and return the group id
pub async fn upsert_group(
    pg_client: &tokio_postgres::Client,
    group: Group,
) -> Result<i32, tokio_postgres::Error> {
    let group_contract_inputs: Vec<i32> = group
        .contract_inputs
        .iter()
        .map(|contract| contract.id as i32)
        .collect();

    // Upsert the group object
    let result = pg_client
        .query_one(
            r#"
            INSERT INTO "Group" ("id", "displayName", "typeId", "contractInputs",  "updatedAt") VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT ("id", "typeId", "contractInputs") DO UPDATE SET "displayName" = $2, "updatedAt" = NOW()
            RETURNING id
        "#,
            &[&(group.id.unwrap() as i32), &group.name, &group.group_type, &group_contract_inputs],
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
            r#"SELECT "id", "displayName", "typeId", "contractInputs" FROM "Group""#,
            &[],
        )
        .await
        .unwrap();

    // Get all contracts from storage
    let contracts = get_contracts(pg_client).await;

    let groups = result
        .iter()
        .map(|row| {
            let group_id: i32 = row.get("id");
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

            Group {
                id: Some(group_id),
                name: group_name,
                group_type,
                contract_inputs,
            }
        })
        .collect();

    groups
}
