import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool(
  process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQLDATABASE_URL
);

export default pool;
