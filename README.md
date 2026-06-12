# AssetFlow — Smart Asset Management Platform
### Cultural Council · IIT Roorkee

AssetFlow is a full-stack asset management and resource allocation platform built for the Cultural Council of IIT Roorkee. It enables efficient tracking, booking, approval, and analytics for shared resources such as DSLR cameras, audio systems, stage props, costumes, and event infrastructure.

---

## Technology Stack

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| Frontend    | React 18, React Router v6, Recharts, Axios     |
| Backend     | Python 3, Flask, Flask-JWT-Extended, Flask-CORS|
| Database    | SQLite3 (built-in Python stdlib)               |
| Auth        | JWT (JSON Web Tokens), bcrypt password hashing |
| QR Codes    | `qrcode` + Pillow (server-side PNG generation) |
| Styling     | Custom CSS with CSS variables (no framework)   |

---

## Project Structure

```
assetflow/
├── backend/
│   ├── app.py              # Flask application — all routes
│   ├── db.py               # SQLite schema & connection helper
│   ├── seed.py             # Demo data seeder
│   ├── requirements.txt    # Python dependencies
│   └── data/               # SQLite DB file (auto-created)
│
└── frontend/
    ├── public/index.html
    └── src/
        ├── App.js                    # Routes & auth guards
        ├── index.css                 # Global styles
        ├── context/AuthContext.js    # JWT auth state
        ├── utils/api.js              # Axios instance
        ├── components/shared/        # Layout, sidebar
        └── pages/
            ├── LoginPage.js
            ├── RegisterPage.js
            ├── DashboardPage.js      # User dashboard
            ├── AssetsPage.js         # Asset browser
            ├── BookingsPage.js       # My bookings
            ├── NewBookingPage.js     # Submit request
            ├── ProfilePage.js
            └── admin/
                ├── AdminDashboard.js # Charts & KPIs
                ├── AdminAssets.js    # Asset CRUD + QR
                ├── AdminBookings.js  # Approve/issue/return
                └── AuditLogsPage.js  # Activity trail
```

---

## Setup Instructions

### Prerequisites
- Python 3.10+ and pip
- Node.js 18+ and npm

### 1 — Backend Setup

```bash
cd assetflow/backend

# Install Python dependencies
pip install -r requirements.txt

# Seed the database with sample data
python seed.py

# Start the backend server (runs on port 5000)
python app.py
```

### 2 — Frontend Setup

```bash
cd assetflow/frontend

# Install Node dependencies
npm install

# Start the React development server (runs on port 3000)
npm start
```

### 3 — Open the app

Navigate to **http://localhost:3000** in your browser.

---

## Running the Application

Both servers must run simultaneously:

| Terminal 1 (Backend)      | Terminal 2 (Frontend)     |
|---------------------------|---------------------------|
| `cd backend && python app.py` | `cd frontend && npm start` |

The React app proxies API calls to `http://localhost:5000` automatically via the `"proxy"` field in `frontend/package.json`.

---

## Demo Credentials

| Role      | Email                    | Password   |
|-----------|--------------------------|------------|
| Admin     | admin@cultiitr.in        | admin123   |
| User      | arjun@iitr.ac.in         | user123    |
| User      | priya@iitr.ac.in         | user123    |

Use the **Demo Admin / Demo User** quick-fill buttons on the login page.

---

## Feature List

### Core Features (Mandatory)

**Authentication & Profiles**
- Secure registration and login with JWT
- Role-based access: `admin` and `user`
- Profile management with optional password change

**Inventory Management (Admin)**
- Add, edit, delete assets
- Categorize assets (DSLR Camera, Audio Systems, Stage Props, etc.)
- Track total and available quantities
- Asset condition tracking (excellent / good / fair / poor)
- Storage location per asset

**Asset Discovery & Booking (User)**
- Browse full asset inventory with search and filters
- Filter by category, availability, status
- Submit booking requests with date range, quantity, and purpose
- System prevents requests exceeding available stock

**Approval Workflow (Admin)**
- Review all pending booking requests
- Approve or reject with an optional note
- Users see status updates in real time

**Asset Issue & Return (Admin)**
- Mark approved bookings as issued (reduces available inventory)
- Mark issued items as returned (restores inventory count)
- Automatic due date tracking; overdue detection via sync endpoint

**Analytics Dashboard (Admin)**
- Summary cards: total assets, pending requests, overdue, active bookings
- Booking trend line chart (30-day rolling)
- Category breakdown pie chart
- Asset utilization bar chart (top 10 by booking count)
- Overdue returns panel with user details

**Borrowing History**
- Users can view all past and active bookings with status
- Filter by status tab
- Admins can view system-wide booking history

### Optional / Bonus Features

**QR Code Generation**
- Per-asset QR code generated server-side (PNG)
- Encodes asset ID, name, and category as JSON
- Downloadable from the admin asset manager

**Audit Logging**
- Every significant action (asset CRUD, booking lifecycle) is logged
- Dedicated Audit Logs page for admins with pagination
- Logs capture user, action type, entity, details, IP, and timestamp

**Asset Health / Maintenance Tracking**
- Users and admins can report maintenance issues
- Severity levels: low / medium / high
- High-severity reports automatically flag asset as `maintenance`

---

## API Overview

| Method | Endpoint                          | Description                  |
|--------|-----------------------------------|------------------------------|
| POST   | /api/auth/register                | Register new user            |
| POST   | /api/auth/login                   | Login, returns JWT           |
| GET    | /api/auth/me                      | Get current user             |
| GET    | /api/assets                       | List assets (search/filter)  |
| POST   | /api/assets                       | Create asset (admin)         |
| PUT    | /api/assets/:id                   | Update asset (admin)         |
| DELETE | /api/assets/:id                   | Delete asset (admin)         |
| GET    | /api/assets/:id/qrcode            | Generate QR code             |
| POST   | /api/bookings                     | Submit booking request       |
| PUT    | /api/bookings/:id/approve         | Approve booking (admin)      |
| PUT    | /api/bookings/:id/reject          | Reject booking (admin)       |
| PUT    | /api/bookings/:id/issue           | Issue asset (admin)          |
| PUT    | /api/bookings/:id/return          | Record return (admin)        |
| GET    | /api/analytics/dashboard          | KPI summary cards            |
| GET    | /api/analytics/utilization        | Asset utilization data       |
| GET    | /api/analytics/booking-trend      | 30-day booking trend         |
| GET    | /api/analytics/audit-logs         | Paginated audit trail        |

---

## Design Decisions

- **Python + SQLite** chosen for zero native compilation issues and portability; SQLite is perfectly sufficient for campus-scale usage and keeps the setup to a single `pip install`.
- **JWT stateless auth** allows the frontend and backend to be deployed independently.
- **Atomic inventory updates** — available_quantity is only decremented at issue time (not at approval), so approved-but-not-yet-issued bookings do not block other approvals. This mirrors real-world practice.
- **Audit middleware pattern** — every state-changing route logs to `audit_logs` before the transaction closes, ensuring the log and the action are always consistent.
