use super::{EventLogLike, EventLogMeta};
use crate::{erc1155_transfer_event, rocksdb_key::ERC1155_TRANSFER_BATCH_EVENT_ID, ContractId};
use prost::Message;
use serde_json::Value;

/// A struct representing a single ERC1155 batch transfer event log
pub struct ERC1155TransferBatchLog {
    inner: erc1155_transfer_event::Erc1155TransferBatchEvent,
    meta: EventLogMeta,
}

impl EventLogLike for ERC1155TransferBatchLog {
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

        let data_len = data.len();
        // First half of "data" field is ids
        let ids = data[..data_len / 2]
            .to_vec()
            .chunks(32)
            .map(|x| x.to_vec())
            .collect::<Vec<Vec<u8>>>();

        // Second half of "data" field is values
        let values = data[data_len / 2..]
            .to_vec()
            .chunks(32)
            .map(|x| x.to_vec())
            .collect::<Vec<Vec<u8>>>();

        let transfer_event = erc1155_transfer_event::Erc1155TransferBatchEvent {
            operator,
            from,
            to,
            ids,
            values,
        };

        let meta = EventLogMeta::from_json(log, contract_id, ERC1155_TRANSFER_BATCH_EVENT_ID);

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
