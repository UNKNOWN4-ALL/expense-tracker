import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../model.js";

const router = express.Router();

// ── POST /api/auth/register ──────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }
    if (username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: "That username is already taken." });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ username, password: hashed });

    res.status(201).json({ message: "Account created.", userId: user._id });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong on our end.", error: err.message });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "No account found with that username." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Wrong password. Try again." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong on our end.", error: err.message });
  }
});

export default router;
