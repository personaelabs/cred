use super::IndexerResources;
use crate::{eth_rpc::Chain, group::Group, processors::GroupIndexer, Address, BlockNum, Error};
use std::collections::HashSet;

pub struct CredddTeamIndexer {
    pub group: Group,
    pub resources: IndexerResources,
}

impl CredddTeamIndexer {
    pub fn new(group: Group, resources: IndexerResources) -> Self {
        CredddTeamIndexer { group, resources }
    }
}

#[async_trait::async_trait]
impl GroupIndexer for CredddTeamIndexer {
    fn group(&self) -> &Group {
        &self.group
    }

    fn chain(&self) -> Chain {
        // Arbitrarily return Mainnet chain
        Chain::Mainnet
    }

    async fn is_ready(&self) -> Result<bool, Error> {
        Ok(true)
    }

    async fn get_members(&self, _block_number: BlockNum) -> Result<HashSet<Address>, Error> {
        let addresses = vec![
            "0x4f7d469a5237bd5feae5a3d852eea4b65e06aad1", // pfeffunit.eth
            "0xcb46219ba114245c3a18761e4f7891f9c4bef8c0", // lsankar.eth
            "0x400ea6522867456e988235675b9cb5b1cf5b79c8", // dantehrani.eth
        ];

        let mut addresses_set = HashSet::new();

        for address in addresses {
            let address = address.trim_start_matches("0x");
            let address = hex::decode(address).unwrap().try_into().unwrap();
            addresses_set.insert(address);
        }

        Ok(addresses_set)
    }

    async fn sanity_check_members(
        &self,
        _members: &[Address],
        _block_number: BlockNum,
    ) -> Result<bool, Error> {
        // No sanity check required
        Ok(true)
    }
}
