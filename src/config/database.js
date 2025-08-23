import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let pool;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  });
}

// Crear pool inicial
pool = createPool();

// Manejador de reconexión
pool.on('error', async (err) => {
  console.error('Database error:', err);
  
  if (err.code === 'PROTOCOL_CONNECTION_LOST' && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.log(`Attempting reconnect #${reconnectAttempts}`);
    
    try {
      pool = createPool();
      console.log('Reconnected to database');
    } catch (reconnectError) {
      console.error('Reconnect failed:', reconnectError);
    }
  }
});

export default pool;


const connection = await mysql.createConnection(process.env.DATABASE_URL);

export default connection;
