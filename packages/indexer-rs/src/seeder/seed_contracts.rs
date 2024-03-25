use crate::{contract::ContractType, eth_rpc::Chain, utils::is_prod, ContractId};

#[derive(Debug, Clone)]
pub struct ContractData {
    pub id: Option<u16>,
    pub contract_type: ContractType,
    pub address: String,
    pub name: String,
    pub deployed_block: u64,
    pub chain: Chain,
    pub symbol: String,
}

pub fn get_seed_contracts() -> Vec<ContractData> {
    let mut contracts = vec![
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce".to_string(),
            name: "Shiba Inu".to_string(),
            deployed_block: 10569013,
            chain: Chain::Mainnet,
            symbol: "shib".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x1151cb3d861920e07a38e03eead12c32178567f6".to_string(),
            name: "Bonk".to_string(),
            deployed_block: 16628745,
            chain: Chain::Mainnet,

            symbol: "BONK".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x6b431b8a964bfcf28191b07c91189ff4403957d0".to_string(),
            name: "CorgiAI".to_string(),
            deployed_block: 18540899,
            chain: Chain::Mainnet,

            symbol: "corgiai".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x6982508145454ce325ddbe47a25d4ec3d2311933".to_string(),
            name: "Pepe".to_string(),
            deployed_block: 17046105,
            chain: Chain::Mainnet,

            symbol: "pepe".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xcf0c122c6b73ff809c693db761e7baebe62b6a2e".to_string(),
            name: "FLOKI".to_string(),
            deployed_block: 14029867,
            chain: Chain::Mainnet,

            symbol: "floki".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xb131f4a55907b10d1f0a50d8ab8fa09ec342cd74".to_string(),
            name: "Memecoin".to_string(),
            deployed_block: 18429439,
            chain: Chain::Mainnet,

            symbol: "meme".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xb9f599ce614feb2e1bbe58f180f370d05b39344e".to_string(),
            name: "PepeFork".to_string(),
            deployed_block: 19117207,
            chain: Chain::Mainnet,

            symbol: "pork".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xac57de9c1a09fec648e93eb98875b212db0d460b".to_string(),
            name: "Baby Doge Coin".to_string(),
            deployed_block: 13570063,
            chain: Chain::Mainnet,

            symbol: "babydoge".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x576e2bed8f7b46d34016198911cdf9886f78bea7".to_string(),
            name: "MAGA".to_string(),
            deployed_block: 17894408,
            chain: Chain::Mainnet,

            symbol: "trump".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x761d38e5ddf6ccf6cf7c55759d5210750b5d60f3".to_string(),
            name: "Dogelon Mars".to_string(),
            deployed_block: 12293419,
            chain: Chain::Mainnet,

            symbol: "elon".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x12970e6868f88f6557b76120662c1b3e50a646bf".to_string(),
            name: "Milady Meme Coin".to_string(),
            deployed_block: 17208204,
            chain: Chain::Mainnet,

            symbol: "ladys".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x72e4f9f808c49a2a61de9c5896298920dc4eeea9".to_string(),
            name: "HarryPotterObamaSonic10Inu (ETH)".to_string(),
            deployed_block: 17228251,
            chain: Chain::Mainnet,

            symbol: "bitcoin".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xc5fb36dd2fb59d3b98deff88425a3f425ee469ed".to_string(),
            name: "Dejitaru Tsuka".to_string(),
            deployed_block: 14845791,
            chain: Chain::Mainnet,

            symbol: "tsuka".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x27c70cd1946795b66be9d954418546998b546634".to_string(),
            name: "Doge Killer".to_string(),
            deployed_block: 10778241,
            chain: Chain::Mainnet,

            symbol: "leash".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xbaac2b4491727d78d2b78815144570b9f2fe8899".to_string(),
            name: "The Doge NFT".to_string(),
            deployed_block: 13130302,
            chain: Chain::Mainnet,

            symbol: "dog".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xa2b4c0af19cc16a6cfacce81f192b024d625817d".to_string(),
            name: "Kishu Inu".to_string(),
            deployed_block: 12260512,
            chain: Chain::Mainnet,

            symbol: "kishu".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xa35923162c49cf95e6bf26623385eb431ad920d3".to_string(),
            name: "Turbo".to_string(),
            deployed_block: 17149228,
            chain: Chain::Mainnet,

            symbol: "turbo".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x7f792db54b0e580cdc755178443f0430cf799aca".to_string(),
            name: "Volt Inu".to_string(),
            deployed_block: 17236595,
            chain: Chain::Mainnet,

            symbol: "volt".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x5026f006b85729a8b14553fae6af249ad16c9aab".to_string(),
            name: "Wojak".to_string(),
            deployed_block: 17069315,
            chain: Chain::Mainnet,

            symbol: "wojak".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xba386a4ca26b85fd057ab1ef86e3dc7bdeb5ce70".to_string(),
            name: "Jesus Coin".to_string(),
            deployed_block: 17118237,
            chain: Chain::Mainnet,

            symbol: "jesus".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x562e362876c8aee4744fc2c6aac8394c312d215d".to_string(),
            name: "Optimus AI".to_string(),
            deployed_block: 16467561,
            chain: Chain::Mainnet,

            symbol: "opti".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x43d7e65b8ff49698d9550a7f315c87e67344fb59".to_string(),
            name: "Shiba Saga".to_string(),
            deployed_block: 17972295,
            chain: Chain::Mainnet,

            symbol: "shia".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x9e20461bc2c4c980f62f1b279d71734207a6a356".to_string(),
            name: "OmniCat".to_string(),
            deployed_block: 18831524,
            chain: Chain::Mainnet,

            symbol: "omni".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x7d8146cf21e8d7cbe46054e01588207b51198729".to_string(),
            name: "BOB Token".to_string(),
            deployed_block: 17083228,
            chain: Chain::Mainnet,

            symbol: "bob".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xa71d0588eaf47f12b13cf8ec750430d21df04974".to_string(),
            name: "Shiba Predator".to_string(),
            deployed_block: 14396702,
            chain: Chain::Mainnet,

            symbol: "qom".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x6bc40d4099f9057b23af309c08d935b890d7adc0".to_string(),
            name: "SnailBrook".to_string(),
            deployed_block: 17088430,
            chain: Chain::Mainnet,

            symbol: "snail".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x32b86b99441480a7e5bd3a26c124ec2373e3f015".to_string(),
            name: "Bad Idea AI".to_string(),
            deployed_block: 17197271,
            chain: Chain::Mainnet,

            symbol: "bad".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xf05897cfe3ce9bbbfe0751cbe6b1b2c686848dcb".to_string(),
            name: "CateCoin".to_string(),
            deployed_block: 16938223,
            chain: Chain::Mainnet,

            symbol: "cate".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xb62e45c3df611dce236a6ddc7a493d79f9dfadef".to_string(),
            name: "Wall Street Memes".to_string(),
            deployed_block: 17372057,
            chain: Chain::Mainnet,

            symbol: "wsm".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x61a35258107563f6b6f102ae25490901c8760b12".to_string(),
            name: "Kitty Inu".to_string(),
            deployed_block: 17302150,
            chain: Chain::Mainnet,

            symbol: "kitty".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xafcdd4f666c84fed1d8bd825aa762e3714f652c9".to_string(),
            name: "Vita Inu".to_string(),
            deployed_block: 14990356,
            chain: Chain::Mainnet,

            symbol: "vinu".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xfad45e47083e4607302aa43c65fb3106f1cd7607".to_string(),
            name: "Hoge Finance".to_string(),
            deployed_block: 11809212,
            chain: Chain::Mainnet,

            symbol: "hoge".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x4ed4e862860bed51a9570b96d89af5e1b0efefed".to_string(),
            name: "Degen".to_string(),
            deployed_block: 8925894,
            chain: Chain::Base,

            symbol: "degen".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x8ed97a637a790be1feff5e888d43629dc05408f6".to_string(),
            name: "Non-Playable Coin".to_string(),
            deployed_block: 17798474,
            chain: Chain::Mainnet,

            symbol: "npc".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x4200000000000000000000000000000000000042".to_string(),
            name: "OP".to_string(),
            deployed_block: 6490467,
            chain: Chain::Optimism,

            symbol: "op".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xaaee1a9723aadb7afa2810263653a34ba2c21c7a".to_string(),
            name: "Mog Coin".to_string(),
            deployed_block: 17731591,
            chain: Chain::Mainnet,

            symbol: "mog".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984".to_string(),
            name: "Uniswap".to_string(),
            deployed_block: 10861674,
            chain: Chain::Mainnet,

            symbol: "uni".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x470c8950c0c3aa4b09654bc73b004615119a44b5".to_string(),
            name: "Kizuna".to_string(),
            deployed_block: 18265095,
            chain: Chain::Mainnet,

            symbol: "kizuna".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2".to_string(),
            name: "MKR".to_string(),
            deployed_block: 4620855,
            chain: Chain::Mainnet,

            symbol: "mkr".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xd8fa690304d2b2824d918c0c7376e2823704557a".to_string(),
            name: "SquidGrow".to_string(),
            deployed_block: 17157845,
            chain: Chain::Mainnet,

            symbol: "squidgrow".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x49642110b712c1fd7261bc074105e9e44676c68f".to_string(),
            name: "DinoLFG".to_string(),
            deployed_block: 15948828,
            chain: Chain::Mainnet,

            symbol: "dino".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x12b6893ce26ea6341919fe289212ef77e51688c8".to_string(),
            name: "Tamadoge".to_string(),
            deployed_block: 15217184,
            chain: Chain::Mainnet,

            symbol: "tama".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xdfdb7f72c1f195c5951a234e8db9806eb0635346".to_string(),
            name: "Feisty Doge NFT".to_string(),
            deployed_block: 13056457,
            chain: Chain::Mainnet,

            symbol: "nfd".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x7b744eea1deca2f1b7b31f15ba036fa1759452d7".to_string(),
            name: "El Hippo".to_string(),
            deployed_block: 17911824,
            chain: Chain::Mainnet,

            symbol: "hipp".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xff836a5821e69066c87e268bc51b849fab94240c".to_string(),
            name: "Real Smurf Cat".to_string(),
            deployed_block: 18129682,
            chain: Chain::Mainnet,

            symbol: "шайлушай".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x2598c30330d5771ae9f983979209486ae26de875".to_string(),
            name: "Any Inu".to_string(),
            deployed_block: 18894536,
            chain: Chain::Mainnet,

            symbol: "ai".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xfb130d93e49dca13264344966a611dc79a456bc5".to_string(),
            name: "DogeGF".to_string(),
            deployed_block: 12510443,
            chain: Chain::Mainnet,

            symbol: "dogegf".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x0d505c03d30e65f6e9b4ef88855a47a89e4b7676".to_string(),
            name: "Zoomer".to_string(),
            deployed_block: 17594376,
            chain: Chain::Mainnet,

            symbol: "zoomer".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xf538296e7dd856af7044deec949489e2f25705bc".to_string(),
            name: "Illumicati".to_string(),
            deployed_block: 18513639,
            chain: Chain::Mainnet,

            symbol: "milk".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x005d1123878fc55fbd56b54c73963b234a64af3c".to_string(),
            name: "Kiba Inu".to_string(),
            deployed_block: 14320884,
            chain: Chain::Mainnet,

            symbol: "kiba".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x8ee325ae3e54e83956ef2d5952d3c8bc1fa6ec27".to_string(),
            name: "Fable Of The Dragon".to_string(),
            deployed_block: 15787768,
            chain: Chain::Mainnet,

            symbol: "tyrant".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x514910771af9ca656af840dff83e8264ecf986ca".to_string(),
            name: "LINK".to_string(),
            deployed_block: 4281611,
            chain: Chain::Mainnet,

            symbol: "link".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x912ce59144191c1204e64559fe8253a0e49e6548".to_string(),
            name: "ARB".to_string(),
            deployed_block: 70398215,
            chain: Chain::Arbitrum,

            symbol: "arb".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x76e222b07c53d28b89b0bac18602810fc22b49a8".to_string(),
            name: "Joe Coin".to_string(),
            deployed_block: 18329212,
            chain: Chain::Mainnet,

            symbol: "joe".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x03049b395147713ae53c0617093675b4b86dde78".to_string(),
            name: "BobaCat".to_string(),
            deployed_block: 18112540,
            chain: Chain::Mainnet,

            symbol: "psps".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xa9d54f37ebb99f83b603cc95fc1a5f3907aaccfd".to_string(),
            name: "Pikaboss".to_string(),
            deployed_block: 16628745,
            chain: Chain::Mainnet,

            symbol: "pika".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x02e7f808990638e9e67e1f00313037ede2362361".to_string(),
            name: "KiboShib".to_string(),
            deployed_block: 16140853,
            chain: Chain::Mainnet,

            symbol: "KIBSHI".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xfaba6f8e4a5e8ab82f62fe7c39859fa577269be3".to_string(),
            name: "Ondo".to_string(),
            deployed_block: 14670968,
            chain: Chain::Mainnet,

            symbol: "ondo".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x58cb30368ceb2d194740b144eab4c2da8a917dcb".to_string(),
            name: "Zyncoin".to_string(),
            deployed_block: 18665578,
            chain: Chain::Mainnet,

            symbol: "zyn".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xe3dbc4f88eaa632ddf9708732e2832eeaa6688ab".to_string(),
            name: "Arbius".to_string(),
            deployed_block: 19215261,
            chain: Chain::Mainnet,

            symbol: "aius".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x77e06c9eccf2e797fd462a92b6d7642ef85b0a44".to_string(),
            name: "Wrapped TAO".to_string(),
            deployed_block: 1652160,
            chain: Chain::Mainnet,

            symbol: "wTAO".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x5a98fcbea516cf06857215779fd812ca3bef1b32".to_string(),
            name: "Lido".to_string(),
            deployed_block: 11473216,
            chain: Chain::Mainnet,
            symbol: "ldo".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xb8a87405d9a4f2f866319b77004e88dff66c0d92".to_string(),
            name: "Sora".to_string(),
            deployed_block: 19235060,
            chain: Chain::Mainnet,

            symbol: "sora".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x24fcfc492c1393274b6bcd568ac9e225bec93584".to_string(),
            name: "Heroes of Mavia".to_string(),
            deployed_block: 18709570,
            chain: Chain::Mainnet,

            symbol: "mavia".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x710287d1d39dcf62094a83ebb3e736e79400068a".to_string(),
            name: "enqAI".to_string(),
            deployed_block: 18569660,
            chain: Chain::Mainnet,

            symbol: "enqai".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x15e6e0d4ebeac120f9a97e71faa6a0235b85ed12".to_string(),
            name: "SatoshiVM".to_string(),
            deployed_block: 18983993,
            chain: Chain::Mainnet,

            symbol: "savm".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x163f8c2467924be0ae7b5347228cabf260318753".to_string(),
            name: "Worldcoin".to_string(),
            deployed_block: 17714705,
            chain: Chain::Mainnet,

            symbol: "wld".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0xf4fbc617a5733eaaf9af08e1ab816b103388d8b6".to_string(),
            name: "Glow".to_string(),
            deployed_block: 18809233,
            chain: Chain::Mainnet,

            symbol: "glw-beta".to_string(),
        },
        ContractData {
            id: None,
            contract_type: ContractType::ERC20,
            address: "0x38e68a37e401f7271568cecaac63c6b1e19130b4".to_string(),
            name: "Banana".to_string(),
            deployed_block: 18135851,
            chain: Chain::Mainnet,
            symbol: "banana".to_string(),
        },
        ContractData {
            id: None,
            address: "0xa0c05e2eed05912d9eb76d466167628e8024a708".to_string(),
            symbol: "ticker".to_string(),
            name: "Ticker".to_string(),
            chain: Chain::Base,
            deployed_block: 11962318,
            contract_type: ContractType::ERC20,
        },
        ContractData {
            id: None,
            address: "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb".to_string(),
            symbol: "PUNK".to_string(),
            name: "CRYPTOPUNKS".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 3914495,

            contract_type: ContractType::Punk,
        },
        ContractData {
            id: None,
            address: "0x5Af0D9827E0c53E4799BB226655A1de152A425a5".to_string(),
            symbol: "MIL".to_string(),
            name: "Milady".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 13090020,

            contract_type: ContractType::ERC721,
        },
        ContractData {
            id: None,
            address: "0xed5af388653567af2f388e6224dc7c4b3241c544".to_string(),
            symbol: "AZUKI".to_string(),
            name: "Azuki".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 13975838,

            contract_type: ContractType::ERC721,
        },
        ContractData {
            id: None,
            address: "0xbd3531da5cf5857e7cfaa92426877b022e612cf8".to_string(),
            symbol: "PPG".to_string(),
            name: "Pudgy Penguins".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 12876179,

            contract_type: ContractType::ERC721,
        },
        ContractData {
            id: None,
            address: "0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03".to_string(),
            symbol: "NOUN".to_string(),
            name: "Nouns".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 12985438,

            contract_type: ContractType::ERC721,
        },
        ContractData {
            id: None,
            address: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d".to_string(),
            symbol: "BAYC".to_string(),
            name: "Bored Ape Yacht Club".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 12985438,

            contract_type: ContractType::ERC721,
        },
        ContractData {
            id: None,
            address: "0x60E4d786628Fea6478F785A6d7e704777c86a7c6".to_string(),
            symbol: "MAYC".to_string(),
            name: "Mutant Ape Yacht Club".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 13117018,

            contract_type: ContractType::ERC721,
        },
        ContractData {
            id: None,
            address: "0x8821bee2ba0df28761afff119d66390d594cd280".to_string(),
            symbol: "DEGODS".to_string(),
            name: "DeGods".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 16940173,

            contract_type: ContractType::ERC721,
        },
        ContractData {
            id: None,
            address: "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e".to_string(),
            symbol: "DOODLE".to_string(),
            name: "Doodles".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 13430097,

            contract_type: ContractType::ERC721,
        },
        ContractData {
            id: None,
            address: "0xdA1bf9B5De160cecdE3f9304B187a2F5F5b83707".to_string(),
            symbol: "CHRONOPHOTO".to_string(),
            name: "Chronophotograph".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 17160816,

            contract_type: ContractType::ERC721,
        },
        ContractData {
            id: None,
            address: "0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7".to_string(),
            symbol: "meebits".to_string(),
            name: "Meebits".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 12358080,

            contract_type: ContractType::ERC721,
        },
        ContractData {
            id: None,
            address: "0x9ef8750c72061edbeeef4beb1aceee5b5a63748a".to_string(),
            symbol: "The187".to_string(),
            name: "The187".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 17052667,

            contract_type: ContractType::ERC721,
        },
        ContractData {
            id: None,
            address: "0x4E1f41613c9084FdB9E34E11fAE9412427480e56".to_string(),
            symbol: "TERRAFORMS".to_string(),
            name: "Terraforms".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 13823015,

            contract_type: ContractType::ERC721,
        },
        ContractData {
            id: None,
            address: "0xd3d9ddd0cf0a5f0bfb8f7fceae075df687eaebab".to_string(),
            symbol: "TEST".to_string(),
            name: "Remilio".to_string(),
            chain: Chain::Mainnet,
            deployed_block: 15323174,

            contract_type: ContractType::ERC721,
        },
        ContractData {
            id: None,
            address: "0xa41273d9ecce19051e109d87431002fb1404d392".to_string(),
            symbol: "crypto-the-game-s1".to_string(),
            name: "Crypto: The Game S1".to_string(),
            chain: Chain::Base,
            deployed_block: 11088633,
            contract_type: ContractType::ERC1155,
        },
    ];

    // Assign unique IDs to each contract
    contracts.iter_mut().enumerate().for_each(|(i, contract)| {
        let id = i as ContractId + 1;
        contract.id = Some(id);
    });

    if is_prod() {
        contracts
    } else {
        // Only return a selected few for preview and dev envs
        let contracts_for_preview = vec!["pika", "KIBSHI", "MIL", "The187"];
        contracts
            .into_iter()
            .filter(|contract| contracts_for_preview.contains(&&contract.symbol[..]))
            .collect()
    }
}
