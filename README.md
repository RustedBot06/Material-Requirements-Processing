# Chips MRP — Modular Plug-and-Play Architecture & Analytics Suite

High-throughput **Material Requirements Planning (MRP)** system for potato chip processing and packaging lines, managing raw materials, finished products, bills of materials (BOM), production schedules, inventory feasibility, and manufacturing analytics.

---

## 1. System Architecture Overview

The system is engineered as two independent, decoupled applications communicating over a strict JSON HTTP API contract:

```
+-------------------------------------------------------------+
|                     REACT FRONTEND                          |
|         React 19 + TypeScript + Vite + Recharts             |
|   (UI Rendering, Navigation, Forms, Visual Chart Analytics) |
+------------------------------+------------------------------+
                               |
                   HTTP JSON Requests / REST API
                      (VITE_API_BASE_URL)
                               |
+------------------------------v------------------------------+
|                     PYTHON BACKEND                          |
|                 Python 3.10+ & Flask 3                      |
| (Sole Authority for Business Logic, MRP Math & Aggregation) |
+------------------------------+------------------------------+
                               |
                   Central SQLite Connection
                   (PRAGMA foreign_keys = ON)
                               |
+------------------------------v------------------------------+
|                   SQLITE DATABASE                           |
|            backend/database/chips_mrp.db                    |
|    (Configurable Path via CHIPS_MRP_DB_PATH env var)        |
+-------------------------------------------------------------+
```

### Core Design Principles:
1. **Single Authority Backend**: Python Flask is the sole authority for business logic, database operations, and analytics calculations. Node.js is used strictly for frontend build tooling and development serving.
2. **Database Plug-and-Play**: The SQLite database path is configurable (`config.py`). Replacing the database requires zero React code changes.
3. **Backend Replaceability**: The frontend communicates solely through `frontend/src/services/api.ts`. Any backend implementing the documented API contract can replace Flask seamlessly.
4. **Data Honesty**: No fabrication of missing transaction data. Where historical transaction ledgers are absent, explicit diagnostic disclosures and current inventory snapshots are provided.

---

## 2. Directory Structure

```
Chips_MRP/
├── backend/
│   ├── app.py                      # Flask application entry point & blueprint registration
│   ├── config.py                   # Central configuration & database path resolution
│   ├── requirements.txt            # Python dependencies (Flask, Flask-CORS)
│   ├── database/
│   │   ├── __init__.py             # Database package initialization
│   │   ├── connection.py           # Centralized SQLite connection & foreign key enforcement
│   │   └── chips_mrp.db            # Default SQLite database
│   ├── routes/
│   │   ├── __init__.py             # Route package exports
│   │   ├── materials.py            # /api/materials CRUD endpoints
│   │   ├── products.py             # /api/products CRUD endpoints
│   │   ├── bom.py                  # /api/bom recipe endpoints
│   │   ├── production.py           # /api/schedule, /api/feasibility, /api/dashboard
│   │   └── analytics.py            # Dedicated /api/analytics endpoints (3 graphs)
│   ├── services/
│   │   ├── __init__.py             # Service package exports
│   │   ├── inventory.py            # Material stock & BOM cost synchronization
│   │   ├── production.py           # Products, BOM recipes, scheduling & feasibility math
│   │   └── analytics.py            # Planned vs actual, shortfall, and stock analytics
│   └── utils/
│       ├── __init__.py             # Utility package exports
│       └── validators.py           # Data validation & boundary checks
│
├── frontend/
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── charts/
│   │   │   ├── ProductionComparison.tsx  # Graph 1: Planned vs Actual Line Chart
│   │   │   ├── ProductionShortfall.tsx   # Graph 2: Output vs Shortfall Grouped Bar Chart
│   │   │   └── MaterialInventory.tsx     # Graph 3: Stock vs Procurement & Diagnostic State
│   │   ├── pages/
│   │   │   └── Analytics.tsx             # Dedicated Manufacturing Analytics page
│   │   ├── services/
│   │   │   └── api.ts                    # Central API client module
│   │   ├── types/
│   │   │   └── index.ts                  # Shared TypeScript models and API interfaces
│   │   ├── App.tsx                       # Root React application component
│   │   ├── main.tsx                      # Vite React entry point
│   │   └── index.css                     # Tailwind CSS v4 design tokens
│   ├── .env.example                # Example environment variables
│   ├── package.json                # Frontend dependencies (React, Vite, Recharts, Lucide)
│   ├── tsconfig.json               # TypeScript compiler options
│   └── vite.config.ts              # Vite configuration & dev proxy
│
├── run_backend.bat                 # Windows launch script for Python backend
├── run_frontend.bat                # Windows launch script for React Vite frontend
├── start.bat                       # Master launch script starting both applications
├── server.ts                       # Integrated Node development server & reverse proxy
├── .gitignore                      # Git ignore patterns
└── README.md                       # Complete documentation
```

---

## 3. Getting Started

### Prerequisites:
- **Python**: Version 3.10 or higher
- **Node.js**: Version 18 or higher (LTS recommended)

### Quick Start (Windows):
Double-click `start.bat` in the project root directory. This script launches both the backend and frontend in separate command windows:
- Backend: `http://localhost:5000/api/health`
- Frontend: `http://localhost:5173` (or `http://localhost:3000` via development proxy)

### Manual Startup:

#### 1. Backend (Python + Flask):
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python app.py
```
Backend runs on `http://127.0.0.1:5000`.

#### 2. Frontend (React + Vite):
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 4. Database Replacement Procedure

The SQLite database is decoupled and configurable:

1. **Locate your compatible database**: Ensure it contains the standard MRP tables: `raw_materials`, `products`, `bom`, and `production_schedule`.
2. **Place the database**:
   - Default path: `backend/database/chips_mrp.db`
   - Custom path: Set the environment variable `CHIPS_MRP_DB_PATH` to your target file path:
     ```bash
     set CHIPS_MRP_DB_PATH=C:\path\to\my_plant_database.db
     ```
3. **Start the backend and frontend**: The backend automatically validates table schema compatibility on boot.
4. **Zero Frontend Modifications**: The React frontend does not store database connection strings or schemas; it continues to work seamlessly through the stable API contract.

---

## 5. Backend Replacement & API Contract

To replace the Python Flask backend with Go, Java Spring, Rust, or Node.js, implement the following endpoints returning standard JSON:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Backend and database schema health check |
| `GET` | `/api/materials` | List all raw materials with unit and stock |
| `POST` | `/api/materials` | Register raw material (`material_name`, `unit`, `stock_qty`, `cost_per_unit`) |
| `PUT` | `/api/materials/:id` | Update raw material & auto-recalculate BOM recipe costs |
| `DELETE` | `/api/materials/:id` | Delete material (blocked if used in active BOM) |
| `GET` | `/api/products` | List all finished product SKUs |
| `POST` | `/api/products` | Register product SKU (`name`, `packet_size`, `stock_qty`, `mrp`) |
| `PUT` | `/api/products/:id` | Update product SKU |
| `DELETE` | `/api/products/:id` | Delete product SKU (blocked if used in BOM or schedule) |
| `GET` | `/api/bom` | List all Bill of Materials recipe lines with joins |
| `POST` | `/api/bom` | Add recipe line (`product_id`, `material_id`, `qty_required`) |
| `PUT` | `/api/bom/:id` | Update recipe line required quantity |
| `DELETE` | `/api/bom/:id` | Remove recipe line |
| `GET` | `/api/schedule` | List all production schedule runs |
| `POST` | `/api/schedule` | Create production plan; saves as `AT_RISK` if stock is short |
| `POST` | `/api/schedule/:id/reserve` | Attempt all-or-nothing material reservation after inventory update |
| `PUT` | `/api/schedule/:id` | Update pending production plan |
| `DELETE` | `/api/schedule/:id` | Delete production run |
| `GET` | `/api/feasibility` | Calculate material feasibility report (`start_date`, `end_date`) |
| `GET` | `/api/dashboard` | Main dashboard summary and telemetry feeds |
| `GET` | `/api/analytics/production-comparison` | Graph 1: Planned vs Actual output series & KPIs |
| `GET` | `/api/analytics/production-shortfall` | Graph 2: Actual output vs daily target shortfall |
| `GET` | `/api/analytics/material-inventory` | Graph 3: Material stock, scheduled demand, & diagnostic notice |

---

## 6. Production Plan and Inventory Lifecycle

Production planning is allowed even when current raw-material stock is insufficient.

- `AT_RISK`: the plan is saved, but one or more BOM requirements are short. No materials are reserved.
- `SCHEDULED`: all BOM requirements are available and reserved in full.
- `COMPLETED`: actual output and consumption are recorded; physical stock and finished-goods stock are updated in one transaction.
- `CANCELLED`: pending reservations are released without consumption.

After a purchase physically arrives, update the Raw Materials inventory yourself. Reorder suggestions are recommendations only; they never create stock or purchase orders automatically. Use the **Reserve** action on an `AT_RISK` plan after updating stock.

Core formulas:

- Required material = planned packets × BOM quantity per packet.
- Available stock = physical stock − active reservations.
- Estimated batch cost = sum(required material × current unit cost).
- Actual batch cost = sum(actual material consumed × unit cost at completion).
- Suggested purchase quantity = max(0, minimum stock threshold + unreserved `AT_RISK` demand − available stock).

The endpoint `POST /api/schedule/:id/reserve` attempts an all-or-nothing reservation for an `AT_RISK` plan.

## 7. Manufacturing Analytics Suite

The dedicated **Analytics** section introduces three interactive graphs:

### Graph 1: Planned vs Actual Production
- **Type**: Interactive Line Chart (Recharts)
- **X-Axis**: Production Date
- **Y-Axis**: Finished Packets
- **Series**: Planned Target (Dashed Slate) & Actual Packout (Solid Royal Blue)
- **Formulas**:
  - `Variance = Actual Quantity - Planned Quantity`
  - `Achievement % = (Actual Quantity / Planned Quantity) * 100`
- **Filters**: Product SKU Selector, Start Date, End Date

### Graph 2: Actual Production vs Production Shortfall
- **Type**: Grouped Bar Chart (Recharts)
- **X-Axis**: Production Date
- **Y-Axis**: Finished Packets
- **Series**: Achieved Output (Blue) & Target Shortfall (Crimson)
- **Formulas**:
  - `Production Shortfall = max(0, Planned Quantity - Actual Quantity)`
- **Key Insight**: Identifies recurring line bottlenecks where manufactured output falls below ERP schedule requirements (distinct from physical scrap/waste).

### Graph 3: Raw Material Procurement vs Remaining Stock
- **Type**: Line Chart & Diagnostic Audit Panel
- **Data Honesty Disclosure**: The existing database schema only maintains the latest `stock_qty` snapshot in `raw_materials` without a historical ledger table (`inventory_transactions` or `procurement_orders`).
- **Implementation**:
  - Clearly reports `historical_data_available: false`.
  - Displays technical gap specification for future ledger tables (`procurement_orders`, `material_consumption_log`).
  - Renders live current stock metrics: on-hand silo stock, total valuation in INR, scheduled production demand, and adequacy buffer.
  - Automatically renders dual-line time series once transaction tables are added.

---

## 8. Verification Checklist

- [x] Python Flask backend running with modular routes, services, and central connection.
- [x] Zero business logic in Node.js; Express serves purely as dev proxy / Vite host.
- [x] Centralized API client `src/services/api.ts` used across all React components.
- [x] Dedicated Analytics page with 3 interactive charts accessible via sidebar navigation.
- [x] All existing CRUD operations, modal confirmations, and validations preserved.
- [x] CSV export support for both shift dispatch reports and analytical datasets.
- [x] Ready-to-use Windows `.bat` startup scripts provided.
