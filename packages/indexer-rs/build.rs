use std::io::Result;
fn main() -> Result<()> {
    prost_build::compile_protos(
        &[
            "../protobufs/schemas/transfer_event.proto",
            "../protobufs/schemas/merkle_proof.proto",
            "../protobufs/schemas/merkle_tree.proto",
        ],
        &["../protobufs/schemas"],
    )?;
    Ok(())
}
