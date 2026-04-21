import express from "express";
import { Transaction } from "../model.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// All transaction routes require auth
router.use(authMiddleware);

// ── GET /api/transactions ────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { category, type, startDate, endDate } = req.query;
    const filter = { userId: req.userId };

    if (category && category !== "all") filter.category = category;
    if (type === "income") filter.amount = { $gt: 0 };
    if (type === "expense") filter.amount = { $lt: 0 };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const transactions = await Transaction.find(filter).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Couldn't fetch transactions.", error: err.message });
  }
});

// ── POST /api/transactions ───────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    if (!title || amount === undefined || amount === null) {
      return res.status(400).json({ message: "Title and amount are required." });
    }
    if (isNaN(amount) || amount === 0) {
      return res.status(400).json({ message: "Amount must be a non-zero number." });
    }

    const transaction = await Transaction.create({
      userId: req.userId,
      title: title.trim(),
      amount: Number(amount),
      category: category || "General",
      date: date || new Date().toISOString().split("T")[0],
    });

    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: "Couldn't save the transaction.", error: err.message });
  }
});

// ── DELETE /api/transactions/:id ─────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found or not yours to delete." });
    }

    await transaction.deleteOne();
    res.json({ message: "Deleted." });
  } catch (err) {
    res.status(500).json({ message: "Couldn't delete that.", error: err.message });
  }
});

// ── GET /api/transactions/summary ───────────────────────────
router.get("/summary", async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId });

    let income = 0;
    let expense = 0;
    const byCategory = {};

    transactions.forEach((t) => {
      if (t.amount > 0) income += t.amount;
      else expense += Math.abs(t.amount);

      if (t.amount < 0) {
        byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount);
      }
    });

    res.json({
      income,
      expense,
      balance: income - expense,
      count: transactions.length,
      byCategory,
    });
  } catch (err) {
    res.status(500).json({ message: "Couldn't calculate summary.", error: err.message });
  }
});

export default router;
