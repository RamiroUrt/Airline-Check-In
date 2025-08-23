import express from "express";
import pool from "../../config/database.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SHOW TABLES");
    res.json({ code: 200, data: rows });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(400).json({ code: 400, errors: "could not connect to db" });
  }
});

export default router;
