use rocksdb::IteratorMode;

use crate::Address;
use std::{collections::HashSet, sync::Arc};

const ADDRESS_TO_GROUP_IDS_KEY_PREFIX: u8 = 4;

/// AddressGroups represents a record in RocksDB that maps an address to a set of group IDs
/// the address belongs to.
pub struct AddressGroups {
    pub address: Address,
    pub group_ids: HashSet<[u8; 32]>,
    rocksdb_client: Arc<rocksdb::DB>,
}

impl AddressGroups {
    /// Get all address -> group records from RocksDB
    pub fn get_all(rocksdb_client: Arc<rocksdb::DB>) -> Vec<Self> {
        let mut address_groups = vec![];

        // Construct the key to start the iterator from
        let mut start_key = vec![ADDRESS_TO_GROUP_IDS_KEY_PREFIX];
        start_key.extend_from_slice(&[0; 20]);

        let iter =
            rocksdb_client.iterator(IteratorMode::From(&start_key, rocksdb::Direction::Forward));

        for item in iter {
            let (key, value) = item.unwrap();

            if key[0] != ADDRESS_TO_GROUP_IDS_KEY_PREFIX {
                break;
            }

            // Get the address from the key
            let address = key[1..].try_into().unwrap();

            // Split the value into 32-byte chunks to get the group IDs
            let group_ids = value
                .chunks(32)
                .map(|chunk| {
                    let group_id: [u8; 32] = chunk.try_into().unwrap();
                    group_id
                })
                .collect();

            address_groups.push(Self {
                address,
                group_ids,
                rocksdb_client: rocksdb_client.clone(),
            });
        }

        address_groups
    }

    /// Get the RocksDB key the given address
    pub fn get_key(address: Address) -> Vec<u8> {
        let mut key = vec![ADDRESS_TO_GROUP_IDS_KEY_PREFIX];
        key.extend_from_slice(&address);

        key
    }

    /// Create a new address -> group record in RocksDB.
    /// If the record already exists, it will be overwritten.
    pub fn create(
        address: Address,
        group_ids: HashSet<[u8; 32]>,
        rocksdb_client: Arc<rocksdb::DB>,
    ) -> Self {
        let key = Self::get_key(address);

        let value = group_ids
            .iter()
            .flat_map(|group_id| group_id.iter())
            .copied()
            .collect::<Vec<u8>>();

        rocksdb_client.put(key, value).unwrap();

        Self {
            address,
            group_ids,
            rocksdb_client,
        }
    }

    /// Get the record for the given address from RocksDB.
    pub fn get(address: Address, rocksdb_client: Arc<rocksdb::DB>) -> Option<Self> {
        // Get the group IDs for the address from RocksDB
        let value = rocksdb_client
            .get(Self::get_key(address))
            .unwrap()
            .unwrap_or(vec![]);

        // Split the value into 32-byte chunks to get the group IDs
        let group_ids = value
            .chunks(32)
            .map(|chunk| {
                let group_id: [u8; 32] = chunk.try_into().unwrap();
                group_id
            })
            .collect();

        Some(Self {
            address,
            group_ids,
            rocksdb_client,
        })
    }

    /// Add a group ID to the address -> group record.
    /// Call `save` to persist the changes to RocksDB.
    pub fn add_group(&mut self, group_id: [u8; 32]) {
        self.group_ids.insert(group_id);
    }

    /// Save changes made to this record to RocksDB.
    pub fn save(&self) {
        let (key, value) = self.to_key_value();

        self.rocksdb_client.put(key, value).unwrap();
    }

    pub fn to_key_value(&self) -> (Vec<u8>, Vec<u8>) {
        let mut key = vec![ADDRESS_TO_GROUP_IDS_KEY_PREFIX];
        key.extend_from_slice(&self.address);

        let mut value = vec![];
        for group_id in &self.group_ids {
            value.extend_from_slice(group_id);
        }

        (key, value)
    }
}

#[cfg(test)]
mod tests {
    use rocksdb::{Options, DB};

    use crate::{test_utils::delete_all, ROCKSDB_PATH};

    use super::*;

    #[test]
    fn test_create_address_groups() {
        const TEST_ROCKSDB_PATH: &str = "test_add_group_id";

        let mut rocksdb_options = Options::default();
        rocksdb_options.create_if_missing(true);

        let rocksdb_client = DB::open(
            &rocksdb_options,
            format!("{}/{}", ROCKSDB_PATH, TEST_ROCKSDB_PATH),
        )
        .unwrap();

        let rocksdb_client = Arc::new(rocksdb_client);

        // Delete all records from the test db
        delete_all(&rocksdb_client);

        let address: Address = [3; 20];
        let mut group_ids = HashSet::new();
        group_ids.insert([1u8; 32]);

        // Create a new address -> group record
        AddressGroups::create(address, group_ids.clone(), rocksdb_client.clone());

        // Get the created record
        let address_groups = AddressGroups::get(address, rocksdb_client.clone()).unwrap();

        assert_eq!(address_groups.group_ids, group_ids);
    }
}
