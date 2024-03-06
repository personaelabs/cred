use serde_json::Value;

/// Convert a serde_json Value to u64 by parsing it as a hex string
pub fn value_to_u64(value: &Value) -> u64 {
    u64::from_str_radix(value.as_str().unwrap().trim_start_matches("0x"), 16).unwrap()
}

/// Convert a serde_json Value to u32
pub fn value_to_u32(value: &Value) -> u32 {
    u32::from_str_radix(value.as_str().unwrap().trim_start_matches("0x"), 16).unwrap()
}

/// Get the block number from a RocksDB key
pub fn get_block_num_from_key(key: &[u8]) -> u64 {
    let mut block_num_bytes = [0; 8];
    block_num_bytes.copy_from_slice(&key[2..10]);
    u64::from_be_bytes(block_num_bytes)
}

/// Get the contract id from a RocksDB key
pub fn get_contract_id_from_key(key: &[u8]) -> u16 {
    let mut contract_id_bytes = [0; 2];
    contract_id_bytes.copy_from_slice(&key[0..2]);
    u16::from_be_bytes(contract_id_bytes)
}
