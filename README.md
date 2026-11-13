# Chips MRP

A web-based **Material Requirements Planning (MRP) system** developed for a potato chips manufacturing unit.

Chips MRP helps manage raw materials, finished products, Bills of Materials (BOM), production scheduling and inventory requirements. It connects production planning with material availability, allowing users to assess whether a planned production run can be carried out with the available inventory.

The project is developed using **React, TypeScript, Python (Flask) and SQLite**.

## Features

### 1. Raw Material Management

* Add, view, update and delete raw materials.
* Maintain stock quantities, units and cost per unit.
* Track inventory adjustments and stock movements.
* Monitor material availability and low-stock conditions.

### 2. Product Management

* Maintain finished product records.
* Store product details such as packet size, stock quantity and MRP.
* Perform standard CRUD operations.

### 3. Bill of Materials (BOM)

* Define the raw materials required to manufacture each product.
* Specify material quantities and wastage percentages.
* Associate BOM entries with their respective products and raw materials.

### 4. Production Planning

* Create and manage production schedules.
* Calculate material requirements using the BOM.
* Check inventory feasibility before production.
* Identify material shortages and manage stock reservations.
* Update inventory when production is completed.
* Release reservations when eligible production plans are cancelled.

### 5. Manufacturing Analytics

* View production-related graphs and analytical summaries.
* Compare planned production with actual output.
* Examine production shortfalls.
* Monitor raw material inventory and related metrics.

The analytics section is being refined as the project develops.

## Technology Stack

| Component     | Technology          |
| ------------- | ------------------- |
| Frontend      | React, TypeScript   |
| Build Tool    | Vite                |
| Charts        | Recharts            |
| Backend       | Python, Flask       |
| Database      | SQLite              |
| Communication | JSON-based HTTP API |

## System Architecture

The application follows a frontend-backend architecture.

* **Frontend:** Handles the user interface, navigation, forms and visualisation of data.
* **Backend:** Handles business logic, validation, production calculations, inventory operations and API requests.
* **Database:** Stores product, raw material, BOM, production and inventory-related records.

The frontend communicates with the backend through API requests. Database operations and manufacturing calculations are handled by the backend.

## Getting Started

### Prerequisites

* Python 3.10 or later
* Node.js and npm
* A modern web browser

### Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

Start the Flask application using its configured entry point.

### Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

The frontend and backend must both be running for the application to function correctly.

*Refer to the project configuration and startup scripts for the actual development ports and launch procedure.*

## Project Status

The core inventory management and production workflows have been implemented. The project is currently undergoing testing, refinement and expansion of its manufacturing analytics capabilities.

## Development

This is an individual academic semester project. Development involves manual implementation, AI-assisted code generation, integration, debugging and testing.

The objective is to build a functional, modular MRP application while understanding the underlying concepts of inventory management, production planning, database design and full-stack development.
