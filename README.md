<<<<<<< HEAD
# Spendwise — Expense Tracker

A full-stack expense tracker with JWT authentication, category-based charts, and a clean responsive UI.

---

## Project Structure

```
expense-tracker/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js          # Register & login routes
│   │   └── transactions.js  # CRUD + summary routes
│   ├── .env                 # Environment variables
│   ├── model.js             # Mongoose schemas (User, Transaction)
│   ├── package.json
│   └── server.js            # Express app entry point
└── frontend/
    ├── index.html           # Main HTML
    ├── style.css            # All styles (responsive + dark mode)
    └── script.js            # Frontend logic
```

---

## Prerequisites

- **Node.js** v18 or later
- **MongoDB** running locally on port 27017

---

## Setup & Run

### 1. Start MongoDB

Make sure MongoDB is running. On Windows:

```bash
net start MongoDB
```

On macOS/Linux:

```bash
mongod
```

### 2. Set up the Backend

```bash
cd backend
npm install
```

Edit `.env` if needed (the defaults work for local dev):

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/expenseDB
JWT_SECRET=your_super_secret_key_change_this_in_production
```

Start the server:

```bash
npm start
```

You should see:
```
✓ MongoDB connected
✓ Server running at http://localhost:5000
```

### 3. Open the Frontend

Just open `frontend/index.html` in your browser. No build step needed.

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login, get JWT |
| GET | `/api/transactions` | Yes | Get all transactions |
| POST | `/api/transactions` | Yes | Add transaction |
| DELETE | `/api/transactions/:id` | Yes | Delete transaction |
| GET | `/api/transactions/summary` | Yes | Get totals + category breakdown |

---

## Features

- JWT-based authentication (tokens expire in 7 days)
- Income / Expense tracking with categories
- Doughnut chart showing expense breakdown by category
- Filter transactions by type or category
- Quick stats: biggest spend, average, top category
- Dark mode with saved preference
- Fully responsive — works on mobile, tablet, and desktop
- Toast notifications
- Auto-login from stored token

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | HTML, CSS, Vanilla JS |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcryptjs |
| Charts | Chart.js |
| Icons | Font Awesome 6 |

---

## Tips for Viva

- **REST API** — every route uses the correct HTTP method and returns JSON
- **JWT** — token is created on login and verified on every protected route
- **bcryptjs** — passwords are hashed with salt rounds, never stored plain
- **Mongoose schemas** — both User and Transaction have validation and type checks
- **CORS** — enabled so the frontend can talk to the backend across origins
- **Environment variables** — secrets live in `.env`, not hardcoded
=======
# expense-tracker
>>>>>>> b667ea58de15a6853dfe35f51a807c167c55c502
