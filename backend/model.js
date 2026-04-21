import mongoose from "mongoose";

// ── User Schema ──────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);

// ── Transaction Schema ───────────────────────────────────────
const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "General",
        "Food",
        "Transport",
        "Shopping",
        "Bills",
        "Health",
        "Entertainment",
        "Salary",
        "Freelance",
      ],
      default: "General",
    },
    date: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
