use log::error;
use std::env;
use std::sync::Arc;
use tokio_postgres::NoTls;

/// Initialize the Postgres client
pub async fn init_postgres() -> Arc<tokio_postgres::Client> {
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    // Connect to the database.
    let (pg_client, connection) = tokio_postgres::connect(&database_url, NoTls).await.unwrap();
    let pg_client = Arc::new(pg_client);

    // The connection object performs the actual communication with the database,
    // so spawn it off to run on its own.
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            error!("connection error: {}", e);
        }
    });

    pg_client
}

/// Initialize the Neynar Postgres client
pub async fn init_neynar_db() -> Arc<tokio_postgres::Client> {
    let database_url = env::var("NEYNAR_DB_URL").expect("NEYNAR_DB_URL must be set");
    // Connect to the database.
    let (pg_client, connection) = tokio_postgres::connect(&database_url, NoTls).await.unwrap();
    let pg_client = Arc::new(pg_client);

    // The connection object performs the actual communication with the database,
    // so spawn it off to run on its own.
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            error!("connection error: {}", e);
        }
    });

    pg_client
}
