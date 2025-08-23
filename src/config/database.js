import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();


const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("❌ DATABASE_URL no está definida.");
}


const pool = mysql.createPool(connectionString);

export default pool;
