import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({ //Creamos un pool de conexiones MySQL
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true, //Hace que si todas las conexiones del pool están ocupadas
  connectionLimit: 10, //cuantas conexiones máximas puede tener abiertas al mismo tiempo
  queueLimit: 0
});

export default pool;
