# 🚀 PHARMACY BACKEND - DATABASE INITIALIZATION

## QUICK START

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure MongoDB

**Option A: Local MongoDB**
- Make sure MongoDB is installed and running
- The default connection is: `mongodb://localhost:27017/pharmacy_system`

⚠️ Stock Audit requires MongoDB transactions, which require a **replica set** (or sharded cluster). A standalone MongoDB server will not work for audits.

**Recommended (Dev): Docker MongoDB Replica Set**
```bash
# from repo root
docker compose -f docker-compose.mongo-rs.yml up -d
```

Then set:
```
MONGODB_URI=mongodb://localhost:27017/pharmacy_system?replicaSet=rs0
```

**Option B: MongoDB Atlas (Cloud)**
- Create a free cluster at https://www.mongodb.com/cloud/atlas
- Get your connection string
- Update `.env` file with your connection string:
  ```
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pharmacy_system
  ```

### 3. Initialize Database
```bash
npm run init-db
```

This will:
- ✅ Connect to MongoDB
- ✅ Create all collections
- ✅ Apply all indexes
- ✅ Create default roles (Admin, Manager, Cashier, Auditor)
- ✅ Create admin user
- ✅ Create sample data

## 📦 Collections Created

1. **generics** - Salt/generic master data
2. **manufacturers** - Manufacturer information
3. **medicines** - Medicine master data (references generic + manufacturer)
4. **suppliers** - Supplier information
5. **batches** - Stock lives here (batch-level quantity)
6. **stock_movements** - Ledger (CRITICAL - every stock change recorded)
7. **sales** - Billing transactions
8. **purchases** - Purchase orders
9. **write_off_logs** - Expired/damaged stock tracking
10. **roles** - User roles and permissions
11. **users** - User accounts
12. **daily_sales_summary** - Precomputed summary data

## 🔐 Default Admin Login

```
Username: admin
Password: admin123
```

## 🔥 Critical Rules Implemented

- ✅ Stock is stored at BATCH level (not medicine level)
- ✅ Every stock change creates a stock_movement record
- ✅ Batch-level FEFO support (indexes for First Expiry First Out)
- ✅ Transaction support enabled
- ✅ All required indexes applied

## 📊 Sample Data Included

- 1 Generic (Paracetamol)
- 1 Manufacturer (Cipla Ltd)
- 1 Supplier (ABC Pharmaceuticals)
- 1 Medicine (Crocin 650mg)
- 1 Batch (500 units in stock)
- 1 Stock Movement (initial purchase)

## Next Steps

1. Start building the transaction engine
2. Implement billing API with FEFO logic
3. Connect frontend to backend

## Database Name

**pharmacy_system**

You can view/manage your database using:
- MongoDB Compass (GUI)
- mongo shell
- MongoDB Atlas web interface (if using cloud)
