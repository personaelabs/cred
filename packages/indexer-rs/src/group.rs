use crate::{
    contract::{get_contracts, Contract},
    utils::{get_group_id, is_prod},
    Error, GroupId, GroupState, GroupType,
};

const PREVIEW_GROUP_IDS: [&str; 12] = [
    "f925c0f578b2c6024c5bbb20947e1af3a0eb944e0c309930e3af644ced5200df", // "Early $PIKA holder",
    "167b42ecc5f95c2c10b5fa08a62929d5e3b4ca43783d96a41e7d014e9d0fd02b", // "$KIBSHI whale",
    "55830aa86161ab70bfd6a96e2abd3b338f13bb1848565c8a23c7c7317b5864a5", // $ticker rug survivor
    "0676adf3eb3332e1e2f80daca621727a80f9e1bb793e6864a85656f61489467c", // creddd team
    "158a378c99e764e3b287ed5b1c938ba4125d828a1d9b30aa2fc1c6dd44207419", // The187 historical holder
    "3544a1d252e2cfffb5d977c9dd2e3766b13a72ea4206c5e29b69502de62a6023", // $Higher believer
    "0958ac3e686d2f77fbee11e9dfcfa35cc83e98249f84cbedf08e2ed82eb2519e", // Early $PAC holder
    "155a295bcc839b97ac181384b1b99af4e1eefac12f173200c4e03a6dbb43eb74", // $PAC whale
    "9aa0652a76f710a10e17ff49c09ba8b04260898a956f4f9d7ee84f6a164d2f8a",
    "0f52c884729bb73f81eafc295e9c8fd492475e28e3cbedba5eed4932049caa70", // base salon
    "b796c128590828f60d84a50abefea8728e3124096614830b371407ab91c86132", // blast salon
    "6c032e7d80cfcc373749ca12f4c28a664193cdf5a60f76383ebbfa788ab93c68"
];

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
pub async fn get_all_groups(pg_client: &tokio_postgres::Client) -> Result<Vec<Group>, Error> {
    // Get all groups from the storage
    let result = pg_client
        .query(
            r#"SELECT "id", "displayName", "typeId", "contractInputs", "score", "state" FROM "Group" where "contractInputs" is not null AND "state" = 'Recordable' "#,
            &[],
        )
        .await?;

    // Get all contracts from storage
    let contracts = get_contracts(pg_client).await?;

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
        .collect::<Vec<Group>>();

    if is_prod() {
        Ok(groups)
    } else {
        // Only return a selected few
        Ok(groups
            .iter()
            .filter(|group| PREVIEW_GROUP_IDS.contains(&group.id.as_str()))
            .cloned()
            .collect())
    }
}
