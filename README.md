# 📒 Apna Khata – Voice-First AI Credit Ledger

> **Making technology understand shopkeepers instead of forcing shopkeepers to learn technology.**

Apna Khata is a multilingual, voice-first AI assistant designed for small shopkeepers, kirana stores, vegetable vendors, and local businesses across India. Instead of maintaining handwritten credit notebooks (Udhaar Khata), shopkeepers simply speak naturally in their preferred language, and Apna Khata records, manages, and tracks customer credit transactions.

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

Apna Khata enables shopkeepers to manage their daily credit ledger using only their voice.

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

### AI Transaction Extraction
Extracts:

- Customer Name
- Amount
- Due Date
- Transaction Type

from natural speech.

### Confirmation Flow
Financial information is never saved automatically.

Users can:

- Confirm
- Edit
- Cancel

before saving.

### Reminder System (Prototype)
- WhatsApp reminder
- SMS reminder

(Customer consent required.)

---

## 🏗️ Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Axios

### Backend

- FastAPI
- Python

### Database

- SQLite
- SQLAlchemy

### Containerization

- Docker
- Docker Compose

---

## 📂 Project Structure

```
apna-khata/

frontend/
backend/
docs/
pitch-deck/

docker-compose.yml
README.md
.env.example
```

---

## 🗄️ Database

### Customer

- id
- name
- phone
- preferred_language

### Ledger

- id
- customer_id
- amount
- remaining_balance
- due_date

### Payment

- id
- ledger_id
- amount
- payment_date

### Voice Log

- id
- transcript
- intent
- confidence

---

## 📌 API Endpoints

```
GET    /dashboard

GET    /customers

POST   /customers

GET    /ledger

POST   /ledger

POST   /payments

GET    /transactions
```

---

## 🚀 Getting Started

Clone the repository

```bash
git clone https://github.com/your-repository.git
```

Open the project

```bash
cd apna-khata
```

Start using Docker

```bash
docker compose up
```

Open

```
Frontend:
http://localhost:3000

Backend:
http://localhost:8000
```

---

## 🔑 Environment Variables

Copy

```
.env.example
```

to

```
.env
```

No secret API keys are required to launch the prototype.

Features requiring external APIs will display:

```
Key not configured
```

instead of crashing.

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
