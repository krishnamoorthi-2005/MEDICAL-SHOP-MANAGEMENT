# Medical Shop Management System

A comprehensive pharmacy management system built with modern web technologies to streamline medical shop operations.

## Features

- **Inventory Management**: Track medicines, batches, and stock levels
- **Sales & Billing**: Process sales with invoice generation
- **Purchase Management**: Manage supplier orders and purchases
- **Customer Management**: Maintain customer records and prescription requests
- **Reports & Analytics**: View sales reports, expiry tracking, and dead stock analysis
- **Stock Audit**: Conduct stock audits and track discrepancies
- **User Management**: Role-based access control (Admin, Staff, User)
- **Forecasting**: AI-powered demand prediction for inventory optimization

## Technologies

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- shadcn-ui components

### Backend
- Node.js + Express
- MongoDB
- Python (for ML predictions)

## Getting Started

### Prerequisites
- Node.js & npm
- MongoDB
- Python 3.x (for prediction features)

### Installation

1. Clone the repository:
```sh
git clone https://github.com/krishnamoorthi-2005/MEDICAL-SHOP-MANAGEMENT.git
cd medical-shop-management
```

2. Install frontend dependencies:
```sh
npm install
```

3. Install backend dependencies:
```sh
cd backend
npm install
```

4. Set up environment variables (create `.env` files as needed)

5. Start MongoDB service

6. Initialize the database:
```sh
cd backend
node scripts/initDatabase.js
```

7. Start the backend server:
```sh
npm start
```

8. Start the frontend development server:
```sh
npm run dev
```

## Project Structure

```
medical-shop-management/
├── backend/              # Express backend
│   ├── controllers/      # Request handlers
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── prediction/      # ML prediction scripts
│   └── middleware/      # Authentication & validation
├── src/                 # React frontend
│   ├── components/      # Reusable components
│   ├── pages/          # Page components
│   └── lib/            # Utilities
└── public/             # Static assets
```

## License

This project is available for educational and commercial use.
