use super::IndexerResources;
use crate::{
    eth_rpc::Chain, group::Group, processors::GroupIndexer, utils::get_members_from_csv, Address,
    BlockNum, Error, GroupType,
};
use std::collections::HashSet;

pub struct SalonIndexer {
    pub group: Group,
    pub resources: IndexerResources,
}

impl SalonIndexer {
    pub fn new(group: Group, resources: IndexerResources) -> Self {
        SalonIndexer { group, resources }
    }
}

#[async_trait::async_trait]
impl GroupIndexer for SalonIndexer {
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
        let file_name = match self.group.group_type {
            GroupType::BaseSalon => "base_salon.csv",
            GroupType::BlastSalon => "blast_salon.csv",
            GroupType::EthSalon => "eth_salon.csv",
            GroupType::FriendBagHolder => "friend_bag_holder.csv",
            GroupType::ArbSalon => "arb_salon.csv",
            GroupType::OpSalon => "op_salon.csv",
            GroupType::Farcaster1K => "fc_1k.csv",
            GroupType::Farcaster10K => "fc_10k.csv",
            GroupType::Farcaster100K => "fc_100k.csv",
            _ => panic!("Invalid group type"),
        };

        let cargo_manifest_dir = std::env::var("CARGO_MANIFEST_DIR");
        let file_path = if cargo_manifest_dir.is_err() {
            format!("./{}", file_name)
        } else {
            format!(
                "{}/src/fixed_groups/{}",
                cargo_manifest_dir.unwrap(),
                file_name
            )
        };

        println!("Reading members from file: {}", file_path);

        let addresses = get_members_from_csv(&file_path);

        let mut addresses_set = HashSet::new();

        for address in addresses {
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
