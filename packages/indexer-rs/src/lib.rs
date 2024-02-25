pub mod storage;
pub mod tree;

pub mod transfer_event {
    include!(concat!(env!("OUT_DIR"), "/transfer_event.rs"));
}

pub mod merkle_proof {
    include!(concat!(env!("OUT_DIR"), "/merkle_proof.rs"));
}
