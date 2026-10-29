# 🌾 KisanBazaar - Farmer Market-Linkage & Logistics Platform

KisanBazaar is a modern full-stack MERN platform empowering Indian farmers by directly connecting them with institutional buyers, local mandis, and verified agricultural transporters.

---

## 🚀 Key Features

- **Farmer Marketplace & Crop Listings**: Farmers can list harvested crop lots with quantity, quality grades, photos, and expected pricing.
- **Buyer Direct Procurement & Bidding**: Verified wholesale buyers and agribusinesses can discover crop lots, place bids, and negotiate pricing in real-time.
- **Live Mandi Rates & Trends**: Real-time mandi price discovery and historical trend analysis across states and agricultural commodities.
- **Transport Finder & Fare Calculator**: Distance-based rate calculation, vehicle capacity matching, transparent fare estimates, and instant transport booking with COD and online payments.
- **Real-Time Messages & Negotiations**: Direct in-app messaging between farmers and buyers with live unread indicators, context badges, and deal linkage.
- **Comprehensive Notification Center**: Real-time status alerts for new bids, counter-offers, deal confirmations, transport bookings, and driver acceptance/rejection.
- **Role-Based Dashboards**: Tailored consoles for Farmers, Buyers, Transporters, Mandi Administrators, and Platform Admins.

---

## 🛠️ Technology Stack

### Frontend (`client/`)
- **React 18** + **Vite**
- **Tailwind CSS** (KisanBazaar Green-White theme)
- **Lucide Icons**
- **Axios** (with credentials & JWT auth)
- **React Router v6**
- **Recharts**

### Backend (`server/`)
- **Node.js** & **Express**
- **MongoDB** & **Mongoose ODM**
- **JWT Authentication** (HttpOnly cookies & Bearer tokens)
- **Bcrypt** password hashing
- **Resend** transactional email verification

---

## 📦 Project Structure

```
KisanBazaar/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # UI components (Navbar, ChatModal, NotificationDropdown, etc.)
│   │   ├── context/        # Auth & Application State
│   │   ├── pages/          # Pages (Dashboard, Messages, TransportFinder, MandiPrices, etc.)
│   │   └── services/       # Axios API client
│   └── package.json
├── server/                 # Express REST API backend
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Auth & error handling middleware
│   ├── models/             # Mongoose schemas (User, CropLot, Offer, Transport, etc.)
│   ├── routes/             # API routes
│   ├── scripts/            # Database seed and test suites
│   ├── utils/              # Helper utilities
│   └── server.js           # Server entry point
├── .gitignore              # Root git ignore
└── README.md
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** running locally (`mongodb://localhost:27017/kisanbazaar`) or MongoDB Atlas URI

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env     # Update environment secrets
npm run seed             # Seed sample mandis, crops, transporters, and users
npm run dev              # Starts API server on port 5000
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev              # Starts Vite dev server on port 5173
```

### 4. Running Verification Test Suites
```bash
cd server
npm run test-auth           # Authentication & security test suite
npm run test-interaction    # Buyer-Farmer deal negotiation test suite
node scripts/testMessagingAndNotifications.js   # Messaging & notifications test suite
```

---

## 📄 License
ISC
