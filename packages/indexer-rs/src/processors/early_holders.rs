use crate::processors::ProcessorLike;
use crate::storage::Storage;
use crate::tree::save_tree;
use crate::TransferEvent;
use std::collections::HashSet;
use std::marker::PhantomData;

pub fn get_early_holder_handle(contract_name: &str) -> String {
    format!("early-holder-{}", contract_name.to_lowercase())
}

pub struct EarlyHolderIndexer<S> {
    pub unique_holders: HashSet<[u8; 20]>,
    pub early_holders: HashSet<[u8; 20]>,
    pub contract_name: String,
    _marker: PhantomData<S>,
}

impl<S: Storage> EarlyHolderIndexer<S> {
    pub fn new(contract_name: String) -> Self {
        EarlyHolderIndexer {
            unique_holders: HashSet::new(),
            early_holders: HashSet::new(),
            contract_name,
            _marker: PhantomData,
        }
    }
}

impl<S: Storage> ProcessorLike<S> for EarlyHolderIndexer<S> {
    fn group_handle(&self) -> String {
        get_early_holder_handle(&self.contract_name)
    }

    fn process_log(&mut self, log: &TransferEvent) -> Result<(), std::io::Error> {
        self.unique_holders.insert(log.to);

        Ok(())
    }

    async fn index_tree(&self, storage: &S, block_number: i64) -> Result<(), S::ErrorType> {
        let total_holders = self.unique_holders.len();

        // Get the first 5% of the holders
        let earliness_threshold = total_holders / 20;

        let early_holders = self
            .unique_holders
            .iter()
            .take(earliness_threshold)
            .copied()
            .collect();

        let group = self.get_group(storage).await?;
        let group_id = group.id;

        save_tree(storage, group_id, early_holders, block_number).await?;

        Ok(())
    }
}
