# BloodLink — Setup Guide

## Prerequisites

- **Node.js** v18+ — https://nodejs.org/en/download
- **MySQL** 8.0+ — https://dev.mysql.com/downloads/mysql/
- **Git** (optional)

---

## Step 1 — MySQL Database Setup

Open MySQL Workbench or MySQL CLI and run the SQL files **in order**:

```sql
-- 1. Create tables
source db/schema.sql

-- 2. Insert seed data
source db/seed.sql

-- 3. Create triggers, views, stored procedure
source db/procedures.sql
```

Or run the first two via command line (schema + seed only):
```bash
mysql -u root -p < db/schema.sql
mysql -u root -p blood_donation_db < db/seed.sql
```

> **⚠️ Warning:** Do **NOT** run `procedures.sql` via CLI (`mysql < procedures.sql`).  
> The `DELIMITER` keyword is only supported in MySQL Workbench / the interactive `mysql` shell.  
> Open **MySQL Workbench**, paste the contents of `db/procedures.sql`, and run it there.

---

## Step 2 — Configure Environment

Edit `server/.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=blood_donation_db
JWT_SECRET=blooddonation_secret_key_2025
PORT=5000
```

---

## Step 3 — Install & Run the Backend

```bash
cd server
npm install
npm run dev
```

Server runs at: http://localhost:5000

---

## Step 4 — Install & Run the Frontend

Open a **new terminal**:

```bash
cd client
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Demo Login Credentials

| Role      | Email                 | Password      |
|-----------|-----------------------|---------------|
| Admin     | admin@biet.ac.in      | admin123      |
| Donor 1   | rajesh@example.com    | donor123      |
| Donor 2   | priya@example.com     | donor123      |
| Recipient | suresh@example.com    | recipient123  |
| Recipient | anita@example.com     | recipient123  |

---

## API Health Check

Visit: http://localhost:5000/api/health

Expected response:
```json
{ "success": true, "message": "Blood Donation API is running.", "data": null }
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ER_ACCESS_DENIED_ERROR` | Check DB_PASSWORD in server/.env |
| `ECONNREFUSED` (MySQL) | Make sure MySQL service is running |
| Port 5000 in use | Change PORT in server/.env |
| Port 5173 in use | Vite will auto-increment to 5174 |
| Trigger DELIMITER error | Run procedures.sql in MySQL Workbench, not CLI |
| Login fails at demo | Re-run seed.sql — hashes must match the passwords above |

---

## Security Note

A `.gitignore` is included. Never commit `server/.env` — it contains your database password.
Before pushing to GitHub, verify `.env` is listed in `.gitignore` (it already is).
