use serde::{Deserialize, Serialize};
use std::{env, fs};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AssetsWithPrices {
    pub address: String,
    pub name: String,
    pub fdv_usd: Option<f64>,
    pub fp_usd: Option<f64>,
}

/// Load the `assets_with_prices.json` file and return a vector of `AssetsWithPrices`
pub fn get_assets_with_prices() -> Vec<AssetsWithPrices> {
    let manifest_dir = env::var("CARGO_MANIFEST_DIR");

    let assets = if manifest_dir.is_err() {
        fs::read_to_string("./assets_with_prices.json")
            .expect("Unable to open assets_with_prices.json")
    } else {
        fs::read_to_string(format!(
            "{}/src/seeder/assets_with_prices.json",
            manifest_dir.unwrap()
        ))
        .expect("Unable to open assets_with_prices.json")
    };

    let assets: Vec<AssetsWithPrices> =
        serde_json::from_str(&assets).expect("Unable to parse contracts.json");

    assets
}
