use jsonrpc_http_server::jsonrpc_core::*;
use jsonrpc_http_server::*;

pub async fn start_server() {
    let mut io = IoHandler::default();
    io.add_method("get_groups", |_params: Params| async {
        Ok(Value::String("hello".to_owned()))
    });

    let server = ServerBuilder::new(io)
        .cors(DomainsValidation::AllowOnly(vec![
            AccessControlAllowOrigin::Null,
        ]))
        .start_http(&"127.0.0.1:3030".parse().unwrap())
        .expect("Unable to start RPC server");

    server.wait();
}
