import pool from '../db/connection.js';

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const [rows] = await pool.query("SELECT id, empid, name, email, role FROM people WHERE email=? AND password=?", [email, password]);
    if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

export const signupUser = async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: "All fields required" });

  try {
    const [existing] = await pool.query("SELECT id FROM people WHERE email=?", [email]);
    if (existing.length > 0) return res.status(409).json({ error: "Email already registered" });

    const empid = `E${String(Date.now()).slice(-6)}`;
    await pool.query("INSERT INTO people (empid, name, email, password, availability) VALUES (?, ?, ?, ?, ?)", [empid, name, email, password, "Unavailable"]);

    res.json({ success: true, message: "Account created successfully" });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};