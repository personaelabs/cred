use super::{EventLogLike, EventLogMeta};
use crate::{erc20_transfer_event, rocksdb_key::ERC20_TRANSFER_EVENT_ID, ContractId};
use prost::Message;
use serde_json::Value;

/// A struct representing a single ERC20 transfer event log
pub struct ERC20TransferLog {
    inner: erc20_transfer_event::Erc20TransferEvent,
    meta: EventLogMeta,
}

impl EventLogLike for ERC20TransferLog {
    fn from_json(log: &Value, contract_id: ContractId) -> Self
    where
        Self: Sized,
    {
        let topics = &log["topics"].as_array().unwrap();

        let from = &topics[1].as_str().unwrap();
        let to = &topics[2].as_str().unwrap();

        let value = hex::decode(log["data"].as_str().unwrap().trim_start_matches("0x")).unwrap();

        let from = hex::decode(&from[from.len() - 40..]).unwrap();
        let to = hex::decode(&to[to.len() - 40..]).unwrap();

        let transfer_event = erc20_transfer_event::Erc20TransferEvent { from, to, value };

        let meta = EventLogMeta::from_json(log, contract_id, ERC20_TRANSFER_EVENT_ID);

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
