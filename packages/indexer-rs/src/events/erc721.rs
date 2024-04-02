use super::{EventLogLike, EventLogMeta};
use crate::{erc721_transfer_event, rocksdb_key::ERC721_TRANSFER_EVENT_ID, ContractId};
use prost::Message;
use serde_json::Value;

/// A struct representing a single ERC712 transfer event log
pub struct ERC721TransferLog {
    inner: erc721_transfer_event::Erc721TransferEvent,
    meta: EventLogMeta,
}

impl EventLogLike for ERC721TransferLog {
    fn from_json(log: &Value, contract_id: ContractId) -> Self
    where
        Self: Sized,
    {
        let topics = &log["topics"].as_array().unwrap();

        let from = &topics[1].as_str().unwrap();
        let to = &topics[2].as_str().unwrap();
        let token_id = &topics[3].as_str().unwrap();

        let from = hex::decode(&from[from.len() - 40..]).unwrap();
        let to = hex::decode(&to[to.len() - 40..]).unwrap();
        let token_id = hex::decode(&token_id[2..]).unwrap();

        let transfer_event = erc721_transfer_event::Erc721TransferEvent { from, to, token_id };

        let meta = EventLogMeta::from_json(log, contract_id, ERC721_TRANSFER_EVENT_ID);

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
