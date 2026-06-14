# 🩸 BloodLink — Blood Donation Management System

A full-stack web application connecting **donors**, **recipients**, and **blood banks** with real-time inventory tracking, smart ABO+Rh compatibility matching, and role-based dashboards. Built as a DBMS academic project.

**Live Demo:** Deployed on Render (single-URL — frontend served from the Express server).

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────┐
│                  BROWSER                    │
│   React 18 SPA (Vite + Tailwind CSS)        │
│   Mobile-first, optimised for 360px×800px   │
└──────────────┬──────────────────────────────┘
               │  HTTP / JSON   (JWT in Auth header)
               ▼
┌─────────────────────────────────────────────┐
│           EXPRESS.JS SERVER  (Node 18+)     │
│   server/server.js — single entry point     │
│   Serves /api/* routes + React static build │
│                                             │
│  Middleware chain:                          │
│    CORS → JSON body → verifyToken → checkRole
└──────────────┬──────────────────────────────┘
               │  mysql2 (promise pool)
               ▼
┌─────────────────────────────────────────────┐
│           MySQL 8.0+ Database               │
│   blood_donation_db                         │
│   7 tables + triggers + stored procedure    │
└─────────────────────────────────────────────┘
```

### Auth Flow
1. User registers → bcrypt hashes password → row inserted in `users` + role table (`donors`/`recipients`)
2. User logs in → bcrypt compares → JWT signed (`{ user_id, role, name, email, profile_id }`)
3. Frontend stores JWT in `localStorage` → attached via `Authorization: Bearer <token>` on every request
4. `verifyToken` middleware decodes token; `checkRole` enforces role access per route group
5. On 401 response, Axios interceptor auto-clears storage and redirects to `/login`

---

## 🗂️ Monorepo File Map

```
blood-donation-system/
├── server/                          # Express.js backend
│   ├── server.js                    # App entry: CORS, routes, static serve, SPA catch-all
│   ├── package.json                 # Dependencies: express, mysql2, bcryptjs, jsonwebtoken, cors, dotenv
│   ├── .env                         # DB credentials + JWT_SECRET + PORT (NOT committed)
│   ├── controllers/
│   │   ├── authController.js        # register, login
│   │   ├── donorController.js       # getDonationHistory, getEligibility, getInventory, registerDonation, getBanks
│   │   ├── recipientController.js   # createRequest, getMyRequests, matchBlood, getBanks, getProfile, updateProfile
│   │   └── adminController.js       # getInventory, updateInventory, getAllRequests, updateRequestStatus,
│   │                                #   getAllDonors, updateDonorEligibility, getAllDonations,
│   │                                #   updateDonationStatus, getSummary, getLowInventory
│   ├── routes/
│   │   ├── auth.js                  # POST /api/auth/register  POST /api/auth/login
│   │   ├── donor.js                 # All /api/donor/* — verifyToken + checkRole('donor')
│   │   ├── recipient.js             # All /api/recipient/* — verifyToken + checkRole('recipient')
│   │   └── admin.js                 # All /api/admin/* — verifyToken + checkRole('admin')
│   ├── middleware/
│   │   ├── verifyToken.js           # Extracts + verifies JWT from Authorization header → req.user
│   │   └── checkRole.js             # Factory: checkRole('admin') → middleware that enforces role
│   └── db/
│       └── (mysql2 pool created inline in each controller — no separate db.js file)
│
├── client/                          # React 18 frontend (Vite)
│   ├── index.html                   # SPA shell
│   ├── vite.config.js               # Vite config
│   ├── tailwind.config.js           # Tailwind — custom 'blood' color palette
│   ├── package.json                 # Dependencies: react, react-router-dom, axios, jwt-decode
│   └── src/
│       ├── main.jsx                 # React DOM root
│       ├── App.jsx                  # BrowserRouter + AppShell + route definitions
│       ├── index.css                # Tailwind base + custom component classes (mobile-first)
│       ├── api/
│       │   └── axios.js             # Axios instance (baseURL='/api', auto-attach JWT, auto-logout on 401)
│       ├── context/
│       │   └── AuthContext.jsx      # Global auth state: user, token, login(), logout(), isAuthenticated
│       ├── components/
│       │   ├── Navbar.jsx           # Top bar: BloodLink logo, role badge, logout button
│       │   ├── BottomTabBar.jsx     # Role-specific bottom navigation (mobile-native feel)
│       │   ├── ProtectedRoute.jsx   # Redirects unauthenticated users; enforces role match
│       │   ├── RequestCard.jsx      # Blood request card (used by recipient + admin)
│       │   ├── DonorCard.jsx        # Donor profile card with eligibility toggle (admin view)
│       │   └── InventoryTable.jsx   # Blood inventory grouped by bank, card grid layout
│       └── pages/
│           ├── Login.jsx            # Email + password login form
│           ├── Register.jsx         # Multi-step registration form (role-specific fields)
│           ├── DonorDashboard.jsx   # Tabs: Overview, History, Inventory
│           ├── RecipientDashboard.jsx # Tabs: Profile, Requests, Find Banks (match)
│           └── AdminDashboard.jsx   # Tabs: Overview, Inventory, Requests, Donors, Donations
│
├── db/
│   ├── schema.sql                   # CREATE TABLE statements — run FIRST
│   ├── seed.sql                     # Demo users, blood banks, inventory, donations, requests
│   └── procedures.sql               # Triggers + stored procedures (run in MySQL Workbench only)
│
├── SETUP.md                         # Local dev setup guide
├── render.yaml                      # Render.com deployment config
└── README.md                        # ← You are here
```

---

## 🗄️ Database Schema

### Tables

| Table | Primary Key | Description |
|---|---|---|
| `users` | `user_id` | Base table for all roles — stores email, bcrypt hash, role enum |
| `donors` | `donor_id` | Linked to `users`, stores blood group, DOB, eligibility flag |
| `recipients` | `recipient_id` | Linked to `users`, stores blood group needed, address, medical condition |
| `blood_banks` | `bank_id` | Blood bank name, location, phone |
| `blood_inventory` | `inventory_id` | Per-bank, per-blood-group unit count |
| `donations` | `donation_id` | Donor → bank donation record with status (pending/completed/rejected) |
| `blood_requests` | `request_id` | Recipient → bank blood request with urgency and status |
| `blood_compatibility` | `(donor_group, recipient_group)` | ABO+Rh compatibility lookup table |

### Key Relationships
```
users ──< donors ──< donations >── blood_banks ──< blood_inventory
users ──< recipients ──< blood_requests >── blood_banks
blood_banks ──< blood_inventory
blood_compatibility (standalone lookup — populated by seed.sql)
```

### Enums
- `users.role`: `donor | recipient | admin`
- `*.blood_group`: `A+ | A- | B+ | B- | AB+ | AB- | O+ | O-`
- `donations.status`: `pending | completed | rejected`
- `blood_requests.status`: `pending | approved | rejected`
- `blood_requests.urgency`: `low | medium | high`

---

## 🌐 API Reference

All API responses follow the envelope:
```json
{ "success": true|false, "message": "...", "data": <payload> }
```

### Auth  `/api/auth`  (public)

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/register` | `{ name, email, password, role, blood_group, dob, phone, address }` | Creates user + role row |
| POST | `/login` | `{ email, password }` | Returns `{ token, user }` |

### Donor  `/api/donor`  🔐 role: donor

| Method | Path | Description |
|---|---|---|
| GET | `/history/:donor_id` | Full donation history |
| GET | `/eligibility/:donor_id` | Eligibility + blood group + last donation date |
| GET | `/inventory` | All bank inventory (read-only view) |
| GET | `/banks` | List of all blood banks |
| POST | `/donate` | Register a new donation `{ donor_id, bank_id, donation_date, units_donated }` |

### Recipient  `/api/recipient`  🔐 role: recipient

| Method | Path | Description |
|---|---|---|
| GET | `/profile/:recipient_id` | Recipient profile (name, email, phone, address) |
| PUT | `/profile/:recipient_id` | Update phone + address |
| POST | `/request` | Submit blood request `{ recipient_id, bank_id, blood_group, units_needed, urgency }` |
| GET | `/requests/:recipient_id` | My blood requests list |
| GET | `/match/:recipient_id?group=O+` | Find compatible banks using `blood_compatibility` table |
| GET | `/banks` | List of all blood banks |

### Admin  `/api/admin`  🔐 role: admin

| Method | Path | Description |
|---|---|---|
| GET | `/inventory` | Full inventory across all banks |
| PUT | `/inventory/update` | Update units `{ inventory_id, units_available }` |
| GET | `/requests` | All blood requests (with recipient info) |
| PUT | `/requests/:id/status` | Approve/reject request `{ status }` |
| GET | `/donors` | All donors list |
| PUT | `/donors/:id/eligibility` | Toggle donor eligibility `{ is_eligible }` |
| GET | `/donations` | All donations |
| PUT | `/donations/:id/status` | Mark donation completed/rejected `{ status }` |
| GET | `/reports/summary` | Counts: donors, recipients, donations, pending requests, low inventory |
| GET | `/low-inventory` | Banks with blood group units < 5 |

---

## 🎨 Frontend Architecture

### Routing & Tab State
- `BrowserRouter` with routes: `/`, `/login`, `/register`, `/donor`, `/recipient`, `/admin`
- **No nested routes** — dashboards use a **tab state pattern**: `activeTab` lifted into `AppShell`, passed as prop to each dashboard, updated via `onTabChange` callback
- `BottomTabBar` renders role-specific tabs and drives `activeTab` changes
- `ProtectedRoute` handles auth guard + role mismatch redirect

### State Management
- **Global auth:** `AuthContext` (React Context + localStorage hydration)
- **Page-local data:** `useState` + `useCallback` + `useEffect` per dashboard — no Redux/Zustand
- All API calls use the shared `src/api/axios.js` instance (auto JWT attach, auto-logout on 401)

### CSS Design System (`src/index.css`)
Custom Tailwind component classes (mobile-first, 360px optimised):

| Class | Usage |
|---|---|
| `.card` | Dark rounded container with border |
| `.stat-card` | Summary metric card (extends `.card`) |
| `.btn-primary` | Blood-red filled button, 44px min-height touch target |
| `.btn-secondary` | Dark outlined button |
| `.btn-success` / `.btn-danger` | Approve / reject action buttons |
| `.form-input` | 16px font (prevents iOS zoom), full-width dark input |
| `.form-label` | Gray label above inputs |
| `.data-table` | Full-width table (hidden on mobile — card grid shown instead) |
| `.table-container` | Horizontal scroll wrapper for `.data-table` |
| `.badge-pending/approved/rejected/completed` | Status pill badges |
| `.blood-group-badge` | Circular blood group indicator |
| `.btm-tab-bar` | Fixed bottom nav bar |
| `.btm-tab-item` | Individual tab button |

### Mobile Responsiveness Strategy
- **Target breakpoint:** `360px × 800px` (primary mobile viewport)
- **Tables on mobile:** All data tables (`data-table`) have a `sm:hidden` partner card grid that renders the same data as stacked, full-width cards
- **Action buttons in cards:** `flex-col sm:flex-row` — stack on mobile, side-by-side on desktop
- **Stat card labels:** `min-h-[32px] sm:min-h-0` — ensures number rows align horizontally even when "Total Requests" wraps to 2 lines
- **Modal:** `w-[calc(100%-32px)]` to prevent edge clipping at 360px
- **iOS inputs:** `font-size: 16px !important` globally to prevent viewport zoom

### Bottom Tab Navigation (per role)

| Role | Tabs |
|---|---|
| Donor | Overview · History · Inventory |
| Recipient | Profile · Requests · Find Banks |
| Admin | Overview · Inventory · Requests · Donors · Donations |

---

## 🔑 JWT Payload Structure

```json
{
  "user_id": 1,
  "role": "donor",
  "name": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "profile_id": 1
}
```
- `profile_id` = `donor_id` / `recipient_id` depending on role (used by dashboards to fetch role-specific data)
- Token stored in `localStorage` under key `"token"`
- Auto-logout: Axios response interceptor catches 401 and clears storage

---

## 🏃 Local Development

### Prerequisites
- Node.js v18+
- MySQL 8.0+

### 1. Database Setup (run in order)
```sql
-- In MySQL Workbench or CLI:
source db/schema.sql   -- creates blood_donation_db + all tables
source db/seed.sql     -- demo users, banks, inventory, data
-- Run procedures.sql ONLY in MySQL Workbench (DELIMITER keyword):
source db/procedures.sql
```

### 2. Backend
```bash
cd blood-donation-system/server
cp .env.example .env         # fill in DB_PASSWORD and JWT_SECRET
npm install
npm run dev                  # nodemon server.js → http://localhost:5000
```

### 3. Frontend (separate terminal)
```bash
cd blood-donation-system/client
npm install
npm run dev                  # Vite → http://localhost:5173
```

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@biet.ac.in | admin123 |
| Donor 1 | rajesh@example.com | donor123 |
| Donor 2 | priya@example.com | donor123 |
| Recipient 1 | suresh@example.com | recipient123 |
| Recipient 2 | anita@example.com | recipient123 |

---

## 🚀 Production Deployment (Render)

Single-URL deployment — the Express server serves both the API and the React build:

1. `npm run build` (in `server/package.json`) → installs client deps + runs `vite build` → outputs to `client/dist`
2. Express `server.js` detects `client/dist` and calls `express.static(distPath)`
3. SPA catch-all `app.get('*')` sends `index.html` for all non-`/api` routes so React Router works on page refresh

Environment variables required on Render:
```
DB_HOST=<render-mysql-hostname>
DB_USER=<user>
DB_PASSWORD=<password>
DB_NAME=blood_donation_db
JWT_SECRET=<random-secret>
PORT=5000
FRONTEND_URL=https://your-app.onrender.com
```

---

## 🧩 Key Design Decisions

| Decision | Reason |
|---|---|
| No ORM — raw `mysql2` queries | DBMS course requires direct SQL; full control over joins, stored procedures |
| JWT stateless auth | No session store needed; easy to deploy on Render free tier |
| Tab state in `AppShell` (not URL) | Simpler than nested routes; bottom tab bar changes tabs without page navigation |
| `BottomTabBar` (not top nav) | Mobile-native UX pattern; keeps primary actions thumb-reachable |
| Dual render: cards + tables | Mobile cards for ≤360px, data tables hidden on mobile via `sm:hidden` / `sm:block` |
| `blood_compatibility` table | ABO+Rh compatibility stored in DB — queried via JOIN for the match endpoint |
| Single-URL Render deploy | Avoids CORS issues in production; one service, one URL |
| `profile_id` in JWT | Avoids extra DB lookup in every request — donor/recipient ID always available |

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Vite 8, Tailwind CSS 3 |
| API client | Axios (with JWT interceptors) |
| Backend | Node.js 18+, Express 4 |
| Database | MySQL 8.0 |
| Auth | JWT (`jsonwebtoken`), `bcryptjs` |
| Deployment | Render.com |
| Package manager | npm |
