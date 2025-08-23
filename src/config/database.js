import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Opción 1: Usar MYSQL_URL (Recomendado para Railway)
if (process.env.MYSQL_URL) {
  var pool = mysql.createPool(process.env.MYSQL_URL);
} 
// Opción 2: Usar variables individuales (Para desarrollo local)
else {
  var pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

// Manejador de eventos para debugging
pool.on('connection', (connection) => {
  console.log('Nueva conexión establecida a la BD');
});

pool.on('acquire', (connection) => {
  console.log('Conexión adquirida', connection.threadId);
});

pool.on('release', (connection) => {
  console.log('Conexión liberada', connection.threadId);
});

pool.on('error', (err) => {
  console.error('Error en el pool de la BD:', err);
});

console.log('🔌 Database pool created successfully');
console.log('📊 Database config:', {
  hasMysqlUrl: !!process.env.MYSQL_URL,
  host: process.env.DB_HOST || 'localhost (fallback)'
});

export default pool;
