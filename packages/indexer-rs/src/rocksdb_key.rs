pub const ERC20_TRANSFER_EVENT_ID: u16 = 1;
pub const ERC721_TRANSFER_EVENT_ID: u16 = 2;

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
pub enum KeyType {
    EventLog = 1,
    SyncLog = 2,
}

const KEY_TYPE_BEGIN: usize = 0;
const KEY_TYPE_BYTES: usize = 1;
const KEY_TYPE_END: usize = KEY_TYPE_BEGIN + KEY_TYPE_BYTES;

const EVENT_ID_BEGIN: usize = KEY_TYPE_END;
const EVENT_ID_BYTES: usize = 2;
const EVENT_ID_END: usize = EVENT_ID_BEGIN + EVENT_ID_BYTES;

const CONTRACT_ID_BEGIN: usize = EVENT_ID_END;
const CONTRACT_ID_BYTES: usize = 2;
const CONTRACT_ID_END: usize = CONTRACT_ID_BEGIN + CONTRACT_ID_BYTES;

const BLOCK_NUM_BEGIN: usize = CONTRACT_ID_END;
const BLOCK_NUM_BYTES: usize = 8;
const BLOCK_NUM_END: usize = BLOCK_NUM_BEGIN + BLOCK_NUM_BYTES;

const LOG_INDEX_BEGIN: usize = BLOCK_NUM_END;
const LOG_INDEX_BYTES: usize = 4;
const LOG_INDEX_END: usize = LOG_INDEX_BEGIN + LOG_INDEX_BYTES;

const TX_INDEX_BEGIN: usize = LOG_INDEX_END;
const TX_INDEX_BYTES: usize = 4;
const TX_INDEX_END: usize = TX_INDEX_BEGIN + TX_INDEX_BYTES;

const CHUNK_NUM_BEGIN: usize = CONTRACT_ID_END;
const CHUNK_NUM_BYTES: usize = 8;
const CHUNK_NUM_END: usize = CHUNK_NUM_BEGIN + CHUNK_NUM_BYTES;

const KEY_BYTES: usize = KEY_TYPE_BYTES
    + EVENT_ID_BYTES
    + CONTRACT_ID_BYTES
    + BLOCK_NUM_BYTES
    + LOG_INDEX_BYTES
    + TX_INDEX_BYTES;

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
pub struct RocksDbKey {
    pub key_type: KeyType,
    pub event_id: u16,
    pub contract_id: u16,
    pub chunk_num: Option<u64>,
    pub block_num: Option<u64>,
    pub log_index: Option<u32>,
    pub tx_index: Option<u32>,
}

impl RocksDbKey {
    pub fn new_start_key(key_type: KeyType, event_id: u16, contract_id: u16) -> Self {
        match key_type {
            KeyType::EventLog => Self {
                key_type,
                event_id,
                contract_id,
                chunk_num: None,
                block_num: Some(0),
                log_index: Some(0),
                tx_index: Some(0),
            },
            KeyType::SyncLog => Self {
                key_type,
                event_id,
                contract_id,
                chunk_num: Some(0),
                block_num: None,
                log_index: None,
                tx_index: None,
            },
        }
    }

    pub fn to_bytes(&self) -> [u8; KEY_BYTES] {
        if self.key_type == KeyType::SyncLog && self.chunk_num.is_none() {
            panic!("Chunk number is required for sync log key");
        }

        if self.key_type == KeyType::EventLog && self.block_num.is_none() {
            panic!("Block number is required for event log key");
        }

        let mut key = vec![];
        let key_type_num = match self.key_type {
            KeyType::EventLog => 1u8,
            KeyType::SyncLog => 2u8,
        };
        key.extend_from_slice(&key_type_num.to_be_bytes());
        key.extend_from_slice(&self.event_id.to_be_bytes());
        key.extend_from_slice(&self.contract_id.to_be_bytes());

        if let Some(chunk_num) = self.chunk_num {
            key.extend_from_slice(&chunk_num.to_be_bytes());
            key.extend_from_slice(&[0; LOG_INDEX_BYTES]);
            key.extend_from_slice(&[0; TX_INDEX_BYTES]);
        }

        if let Some(block_num) = self.block_num {
            key.extend_from_slice(&block_num.to_be_bytes());
            key.extend_from_slice(&self.tx_index.unwrap().to_be_bytes());
            key.extend_from_slice(&self.log_index.unwrap().to_be_bytes());
        }

        key.try_into().unwrap()
    }

    pub fn from_bytes(key: [u8; KEY_BYTES]) -> Self {
        let key_type = match key[KEY_TYPE_BEGIN] {
            1 => KeyType::EventLog,
            2 => KeyType::SyncLog,
            _ => panic!("Invalid key type"),
        };

        let mut event_id_bytes = [0; EVENT_ID_BYTES];
        event_id_bytes.copy_from_slice(&key[EVENT_ID_BEGIN..EVENT_ID_END]);
        let event_id = u16::from_be_bytes(event_id_bytes);

        let mut contract_id_bytes = [0; CONTRACT_ID_BYTES];
        contract_id_bytes.copy_from_slice(&key[CONTRACT_ID_BEGIN..CONTRACT_ID_END]);
        let contract_id = u16::from_be_bytes(contract_id_bytes);

        let chunk_num = if key_type == KeyType::SyncLog {
            let mut chunk_num_bytes = [0; CHUNK_NUM_BYTES];
            chunk_num_bytes.copy_from_slice(&key[CHUNK_NUM_BEGIN..CHUNK_NUM_END]);
            Some(u64::from_be_bytes(chunk_num_bytes))
        } else {
            None
        };

        let (block_num, tx_index, log_index) = if key_type == KeyType::EventLog {
            let mut block_num_bytes = [0; BLOCK_NUM_BYTES];
            block_num_bytes.copy_from_slice(&key[BLOCK_NUM_BEGIN..BLOCK_NUM_END]);

            let mut tx_index_bytes = [0; 4];
            tx_index_bytes.copy_from_slice(&key[TX_INDEX_BEGIN..TX_INDEX_END]);

            let mut log_index_bytes = [0; 4];
            log_index_bytes.copy_from_slice(&key[LOG_INDEX_BEGIN..LOG_INDEX_END]);

            (
                Some(u64::from_be_bytes(block_num_bytes)),
                Some(u32::from_be_bytes(tx_index_bytes)),
                Some(u32::from_be_bytes(log_index_bytes)),
            )
        } else {
            (None, None, None)
        };

        Self {
            key_type,
            event_id,
            contract_id,
            chunk_num,
            block_num,
            log_index,
            tx_index,
        }
    }
}
