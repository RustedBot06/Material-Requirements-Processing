# Chips MRP
### Material Requirements Planning System for Potato Chips Manufacturing

**Version:** 1.0  
**Status:** v1 — Local Development Release  
**Repository:** [RustedBot06/Material-Requirements-Processing](https://github.com/RustedBot06/Material-Requirements-Processing)

Chips MRP is a web-based **Material Requirements Planning (MRP) system** developed for a potato chips manufacturing unit.

The application helps manage raw materials, finished products, Bills of Materials (BOM), production scheduling, and inventory requirements. It connects production planning with material availability, allowing users to assess whether a planned production run can be carried out with the available inventory.

The project is developed using React, TypeScript, Python (Flask), and SQLite.

---

## 1. Project Objectives

The primary objectives of Chips MRP are to:

- Digitise raw material and finished product inventory management.
- Maintain structured Bills of Materials for manufactured products.
- Calculate raw material requirements for planned production.
- Evaluate production feasibility based on available inventory.
- Manage material reservations and production-related stock movements.
- Provide analytical insights into inventory and manufacturing performance.

## 2. Features

### 2.1 Raw Material Management

- Add, view, update, and delete raw materials.
- Maintain stock quantities, measurement units, and cost per unit.
- Record inventory adjustments and stock movements.
- Monitor material availability and low-stock conditions.

### 2.2 Product Management

- Maintain finished product records.
- Store product information, including packet size, stock quantity, and MRP.
- Perform standard CRUD (Create, Read, Update, Delete) operations.

### 2.3 Bill of Materials (BOM)

- Define the raw materials required to manufacture each product.
- Specify required material quantities and wastage percentages.
- Associate BOM entries with their respective products and raw materials.
- Use BOM data as the basis for production material calculations.

### 2.4 Production Planning

- Create and manage production schedules.
- Calculate raw material requirements using BOM specifications.
- Evaluate production feasibility against available inventory.
- Identify material shortages before production.
- Manage stock reservations for eligible production plans.
- Update inventory upon production completion.
- Release reservations when eligible production plans are cancelled.

### 2.5 Manufacturing Analytics

- View production-related graphs and analytical summaries.
- Compare planned production with actual output.
- Examine production shortfalls.
- Monitor raw material inventory and stock movements.
- Analyse inventory-related metrics.

## 3. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript |
| Build Tool | Vite |
| Charts and Visualisation | Recharts |
| Backend | Python, Flask |
| Database | SQLite |
| Application Server | Node.js, Express |
| API Communication | JSON over HTTP |

## 4. System Architecture

Chips MRP follows a frontend-backend architecture.

**Frontend:** The React application handles the user interface, navigation, forms, data presentation, and graphical visualisations.

**Backend:** The Flask application handles API requests, business logic, input validation, production calculations, and inventory operations.

**Database:** SQLite provides persistent storage for raw materials, products, BOM entries, production schedules, and inventory-related records.

**Application Server:** The root Node.js server coordinates the application, starts the Flask backend, serves the Vite frontend, and proxies API requests.

### Application Workflow

1. The user interacts with the React frontend.
2. The frontend sends HTTP requests to the application server.
3. The application server forwards API requests to Flask.
4. Flask executes business logic and database operations.
5. The backend returns JSON responses.
6. The frontend updates the interface and visualisations.

## 5. Installation and Setup

### Prerequisites

Install the following software:

- **Python 3.10 or later**
- **Node.js (LTS version)**
- **npm** (included with Node.js)
- **Git**
- A modern web browser

### Step 1: Clone the Repository

Open a terminal and execute:

```bash
git clone https://github.com/RustedBot06/Material-Requirements-Processing.git
cd Material-Requirements-Processing
```

### Step 2: Install Dependencies

Install the project dependencies from the root directory:

```bash
npm install
```

Ensure that the Python dependencies specified by the backend's `backend/requirements.txt` are installed in the Python environment used by the application.

### Step 3: Launch the Application

From the project root directory, run:

```bash
npm run dev
```

The root application server automatically starts the Flask backend and the frontend development server.

### Step 4: Open the Application

Open the following address in your web browser:

**http://localhost:3000**

The application runs locally on the machine. No separate frontend or backend startup command is required.

## 6. Database Management

Chips MRP uses **SQLite**, a lightweight relational database that does not require a separate database server.

The database stores information related to:

- Raw materials and their inventory.
- Finished products.
- Bill of Materials entries.
- Production schedules.
- Inventory movements and reservations.

The backend automatically initialises the database when it contains zero entries, allowing a fresh installation to prepare its database without manual table creation.

Existing database records are retained during normal application use.

**Note:** The SQLite database is stored locally. Cloning the GitHub repository does not transfer another user's local database records.

## 7. Project Structure

The project is organised into frontend and backend components, alongside the root application launcher and configuration files.

```text
Chips_MRP/
│
├── frontend/
│   ├── src/
│   │   ├── charts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── database/
│
├── server.ts
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

*This is a representative overview; additional files and modules may be present.*

## 8. Project Status — v1

Version 1.0 establishes the core application as a locally hosted MRP system.

The current release focuses on:

- Raw material and finished product management.
- BOM-based material requirement calculations.
- Production planning and inventory operations.
- Manufacturing analytics and graphical representations.
- Integration between the React frontend, Flask backend, and SQLite database.

The application is intended to run locally at `http://localhost:3000`.

## 9. Future Scope

Potential improvements beyond v1 include:

- Enhanced production cost analysis.
- More detailed manufacturing performance reports.
- Improved inventory forecasting.
- Production scheduling optimisation.
- Additional reporting and data export facilities.
- Further application validation and operational safeguards.

These are prospective improvements and are not necessarily included in v1.

## 10. Development and Acknowledgements

Chips MRP is an individual academic semester project.

Development has involved manual programming, AI-assisted development, integration, debugging, and testing.

The project provides practical experience in full-stack development, relational database design, inventory management, and production planning.

---

**Project:** Chips MRP  
**Version:** 1.0  
**Category:** Academic Semester Project  
**Domain:** Manufacturing / Material Requirements Planning  
**Deployment:** Localhost  
**Repository:** [GitHub — Material-Requirements-Processing](https://github.com/RustedBot06/Material-Requirements-Processing)