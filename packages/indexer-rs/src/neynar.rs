use std::{collections::HashMap, time::Instant};

use log::info;

use crate::utils::format_address;

/// Get the mapping (fid -> verified addresses) from the Neynar database
pub async fn get_verified_addresses(
    fc_replica_client: &tokio_postgres::Client,
) -> Result<HashMap<i64, Vec<String>>, tokio_postgres::Error> {
    let mut fid_to_verified_addresses = HashMap::<i64, Vec<String>>::new();

    let mut offset = 0i64;
    let limit = 20000i64;
    loop {
        // Get all addresses
        let start = Instant::now();
        let verified_addresses = fc_replica_client
            .query(
                r#"
                SELECT
                    fid,
                    ARRAY_AGG(claim->>'address') as "addresses"
                FROM
                    verifications
                WHERE
                    deleted_at IS NULL
                GROUP BY
                    fid
                ORDER BY
                    fid ASC
                OFFSET $1
                LIMIT $2
                "#,
                &[&offset, &limit],
            )
            .await?;

        info!("Query time offset={}: {:?}", offset, start.elapsed());

        if verified_addresses.is_empty() {
            break;
        }

        for verified_address in verified_addresses {
            let fid: i64 = verified_address.get("fid");
            let addresses: Vec<String> = verified_address.get("addresses");

            if fid_to_verified_addresses.get(&fid).is_some() {
                panic!("Duplicate fid: {}", fid);
            }

            // Format addresses
            let addresses = addresses
                .iter()
                .map(|address| format_address(address))
                .collect::<Vec<String>>();

            fid_to_verified_addresses.insert(fid, addresses);
        }

        offset += limit;
    }

    Ok(fid_to_verified_addresses)
}

/// Get the mapping (fid -> custody address) from the Neynar database
pub async fn get_custody_addresses(
    client: &tokio_postgres::Client,
) -> Result<HashMap<i64, String>, tokio_postgres::Error> {
    let custody_addresses = client
        .query(
            r#"
            SELECT
                fid,
                custody_address
            FROM
                fids
            ORDER BY
                fid ASC
            "#,
            &[],
        )
        .await?;

    let mut fid_to_custody_address = HashMap::<i64, String>::new();

    for custody_address in custody_addresses {
        let fid: i64 = custody_address.get("fid");
        let address: Vec<u8> = custody_address.get("custody_address");

        let address = format_address(&hex::encode(address));

        if fid_to_custody_address.get(&fid).is_some() {
            panic!("Duplicate fid: {}", fid);
        }

        fid_to_custody_address.insert(fid, address);
    }

    Ok(fid_to_custody_address)
}
