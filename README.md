# 📒 Apna Khata – Voice-First AI Credit Ledger

> **Making technology understand shopkeepers instead of forcing shopkeepers to learn technology.**

Apna Khata is a multilingual, voice-first khata assistant designed for small
shopkeepers, kirana stores, vegetable vendors, and local businesses across
India. Instead of maintaining handwritten credit notebooks (Udhaar Khata),
shopkeepers can speak naturally, review the extracted transaction, and keep
customer balances organized.

Built for the **Round 2 Hackathon** under the **Livelihoods and Small Business** theme.

---

## 🚀 Problem Statement

Millions of Indian shopkeepers still maintain handwritten credit records. As customer numbers grow, it becomes difficult to:

- Track outstanding balances
- Record partial payments
- Remember due dates
- Follow up with customers
- Avoid calculation mistakes

Manual bookkeeping consumes valuable time and often results in delayed collections and inaccurate records.

---

## 💡 Solution

Apna Khata gives shopkeepers a digital, customer-wise ledger with a voice-first
transaction flow. The browser converts speech to text, a local rule-based parser
proposes the customer, amount, type and dates, and the shopkeeper reviews the
draft before the backend saves it.

Example:

> "Pawan bought groceries worth ₹2,000 today. He will pay on December 15."

The system automatically extracts:

- Customer Name
- Transaction Amount
- Due Date
- Transaction Type

After confirmation, the transaction is stored in the digital ledger.

Similarly,

> "Pawan paid ₹500."

updates the outstanding balance automatically.

---

## 🎯 Target Users

- Kirana Stores
- Grocery Shops
- Vegetable Vendors
- Local Retail Shops
- Small Businesses
- Rural Entrepreneurs
- Tier-2 & Tier-3 City Shopkeepers

---

## ✨ Features

### Voice First Interface
- Large microphone interface
- Minimal typing
- Natural conversation
- Full interface localization in English, Telugu and Hindi
- Preferred language saved to the shop profile and reused on sign-in
- Speech recognition locale follows that saved preference

### Digital Credit Ledger
- Customer-wise ledger
- Outstanding balances
- Due dates
- Payment history

### Dashboard
- Total Outstanding Credit
- Total Customers
- Recent Transactions
- Upcoming Due Payments

### Customer Management
- Add customers
- View customer history
- Search customer
- Ledger overview

### Payment Management
- Record full payments
- Record partial payments
- Automatic balance calculation

### Voice parsing and review
- Browser speech recognition when available, with a typed-command fallback
- English, Telugu and Hindi interface and speech-recognition locales
- Rule-based extraction and common-name aliases for customer, amount, transaction and date phrases
- A confidence indicator and editable confirmation screen
- Original voice transcript and detected language stored with confirmed entries

### Voice-first customer management
- Start add, find, edit and delete workflows by speaking in the selected language
- Local name similarity checks ask for confirmation before reusing a close customer match
- Manual customer details are available as a fallback; customer names are retained as Unicode text
- Customer matching is local rule-based logic, not a hosted AI model

### Confirmation Flow
Financial information is never saved automatically.

Users can:

- Confirm
- Edit
- Cancel

before saving.

### Khata reminders
- Due-today, due-tomorrow and overdue customers appear on the dashboard and reports
- Reminder text can be reviewed and then opened in WhatsApp
- No message is sent automatically; shopkeeper confirmation is required

---

## 🏗️ Tech Stack

### Frontend

- React 18
- Vite
- React Router DOM
- Axios and Context API
- JavaScript and responsive CSS (no UI framework)
- Browser Speech Recognition API when supported

### Backend

- Node.js and Express
- Mongoose models for MongoDB
- OTP-based phone authentication (development demo mode)
- REST endpoints for customers, transactions, reports and reminders

---

## 📂 Project Structure

```
apna-khata/
├── index.html
├── package.json
├── vite.config.js
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── test/
│   ├── utils/
│   └── server.js
└── src/
    ├── App.jsx
    ├── context/
    ├── hooks/
    ├── components/
    │   ├── BottomNavigation/
    │   ├── CustomerCard/
    │   ├── CustomerFormModal/
    │   ├── EmptyState/
    │   ├── LoadingScreen.jsx
    │   ├── Navbar/
    │   ├── QuickActions/
    │   ├── RecentTransactions/
    │   ├── ReminderBanner/
    │   ├── SearchBar/
    │   ├── SummaryCards/
    │   ├── VoiceButton/
    │   └── Icon.jsx
    ├── main.jsx
    ├── pages/
    ├── routes.jsx
    ├── services/
    ├── utils/
    │   ├── formatCurrency.js
    │   └── khataDates.js
    └── styles/
        ├── global.css
        ├── theme.css
        └── variables.css
```

---

## 🗄️ Database

Mongoose models are defined for `Shopkeeper`, `Customer`, and `Transaction`.
Transaction creation and the customer's balance update run together in a MongoDB
transaction. Use MongoDB Atlas or another replica-set deployment for persistence.
Without `MONGODB_URI`, the API starts in demo-only in-memory mode; records are
cleared when the API process restarts.

---

## 📌 API Endpoints

```
POST   /api/auth/request-otp
POST   /api/auth/verify-otp
GET    /api/auth/me
PATCH  /api/auth/profile
GET    /api/dashboard
GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PATCH  /api/customers/:id
DELETE /api/customers/:id
GET    /api/transactions
POST   /api/transactions       (confirmed transactions only)
GET    /api/reports
GET    /api/reminders
GET    /api/reminders/:customerId
GET    /api/health
```

---

## 🚀 Getting Started

From the repository root, install dependencies and start both the API and Vite
frontend:

```bash
npm install
npm run dev
```

The Vite server prints its local URL. The demo phone number is `9876543210`;
development mode displays the OTP in the login screen (`123456` for that demo
number). The demo account starts with sample khatas.

Run tests and a production frontend build with:

```bash
npm test
npm run build
```

Voice recognition requires a supported browser and microphone permission.

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` to configure the backend. `MONGODB_URI` is optional
for a quick in-memory demo, but required for persistent data. MongoDB must support
replica-set transactions.

OTP delivery is intentionally not simulated as a real SMS integration: in
development the API returns a demo code; production login returns a clear
configuration error until an SMS/OTP provider is integrated. Set a strong
`JWT_SECRET` before production deployment. The transaction parser is a
deterministic, replaceable MVP parser, not a hosted LLM; speech recognition
behavior and language coverage depend on the user's browser.

---

## 📹 Demo

A complete demonstration video (under 3 minutes) will be included with the final submission.

---

## 📊 Future Scope

- Offline mode
- OCR bill scanning
- Inventory management
- GST reports
- Analytics dashboard
- UPI integration
- Multi-shop support
- WhatsApp Business integration

---

## 👥 Team

SSP Hackathon Team

Project:
**Apna Khata**

---

## 📄 License

This project was developed exclusively for the Hackathon and is intended for educational and demonstration purposes.
