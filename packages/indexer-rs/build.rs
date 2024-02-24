use std::io::Result;
fn main() -> Result<()> {
    prost_build::compile_protos(&["./src/transfer_event.proto"], &["src/"])?;
    Ok(())
}
