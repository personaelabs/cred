use super::{EventLogLike, EventLogMeta};
use crate::{erc1155_transfer_event, rocksdb_key::ERC1155_TRANSFER_SINGLE_EVENT_ID, ContractId};
use prost::Message;
use serde_json::Value;

/// A struct representing a single ERC1155 transfer (single) event log
pub struct ERC1155TransferSingleLog {
    inner: erc1155_transfer_event::Erc1155TransferSingleEvent,
    meta: EventLogMeta,
}

impl EventLogLike for ERC1155TransferSingleLog {
    fn from_json(log: &Value, contract_id: ContractId) -> Self
    where
        Self: Sized,
    {
        let topics = &log["topics"].as_array().unwrap();

        let operator = &topics[1].as_str().unwrap();
        let from = &topics[2].as_str().unwrap();
        let to = &topics[3].as_str().unwrap();

        let operator = hex::decode(&operator[operator.len() - 40..]).unwrap();
        let from = hex::decode(&from[from.len() - 40..]).unwrap();
        let to = hex::decode(&to[to.len() - 40..]).unwrap();

        let data = hex::decode(log["data"].as_str().unwrap().trim_start_matches("0x")).unwrap();

        // First 32 bytes of "data" field is id
        let id = data[..32].to_vec();
        // Next 32 bytes is value
        let value = data[32..64].to_vec();

        let transfer_event = erc1155_transfer_event::Erc1155TransferSingleEvent {
            operator,
            from,
            to,
            id,
            value,
        };

        let meta = EventLogMeta::from_json(log, contract_id, ERC1155_TRANSFER_SINGLE_EVENT_ID);

        Self {
            inner: transfer_event,
            meta,
        }
    }

    fn event_meta(&self) -> EventLogMeta {
        self.meta
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut buf = Vec::new();
        self.inner.encode(&mut buf).unwrap();
        buf
    }
}
