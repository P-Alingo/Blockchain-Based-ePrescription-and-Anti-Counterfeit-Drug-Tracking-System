import express from "express";
import { pool } from "../config/database.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/users/:id/dashboard
router.get("/:id/dashboard", authMiddleware, async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query(
      "SELECT id, full_name, email, wallet_address, role, user_code FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User dashboard not found" });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      walletAddress: user.wallet_address,
      role: user.role,
      userCode: user.user_code,
      // Add more fields as needed
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

export default router;
