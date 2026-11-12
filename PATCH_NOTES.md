# Chips MRP — Functional Corrections (12 November 2026)

## Production-plan lifecycle

- `SCHEDULED`: every BOM material requirement is reserved in full.
- `AT_RISK`: the plan exists, but at least one material is insufficient. No material is reserved for that plan.
- `COMPLETED`: production has been recorded, physical raw-material stock has been deducted, finished-product stock has been increased, and actual material costs have been snapshotted.
- `CANCELLED`: pending reservations are released; no material is consumed.

A plan can be created even when inventory is insufficient. The user updates inventory after materials physically arrive and then selects **Reserve** on the plan. Reservation is all-or-nothing.

## Calculations

- Material requirement = planned packet quantity × BOM quantity per packet.
- Available stock = physical stock − active reservations.
- Estimated batch cost = sum(BOM requirement × planned quantity × current material unit cost).
- Estimated unit cost = estimated batch cost ÷ planned packet quantity.
- Actual batch cost = sum(actual consumed quantity × unit cost at completion).
- Reorder suggestion = max(0, minimum stock threshold + AT_RISK unreserved production demand − available stock).

Reorder suggestions never update stock. Physical inventory changes only through a user-entered material update, a reasoned stock adjustment, or a valid production completion.

## Cost handling

- Pending-plan estimates are recalculated when BOM quantities or raw-material unit prices change.
- A BOM change releases pending reservations for that product and moves affected plans to `AT_RISK`; the user must reserve them again after the new requirements are checked.
- Completed batch cost snapshots are not recalculated when today's BOM or prices change.
- Existing batch-cost rows are tagged `LEGACY_UNVERIFIED` by migration; only new completion snapshots are tagged `ACTUAL`. Cost breakdowns and cost trends visibly distinguish these.
- Actual consumption is recorded only when a plan is completed. No draft/historical material snapshot is created at scheduling time.

## Inventory protections

- Manual stock reductions cannot take physical stock below active reservations.
- Production completion validates all material requirements before writing any changes.
- If actual output would consume stock promised to another plan, completion is rejected and the transaction rolls back.
- Completed production records cannot be edited or deleted through the schedule endpoints.

## Analytics and tables

- Graph 3 uses `stock_movements` as the historical source of truth. It no longer rebuilds old consumption using today's BOM.
- Initial balance is shown separately from subsequent stock inflows.
- Production consumption and manual stock decreases are distinguished.
- Production comparison/shortfall calculations include completed runs only, not plans that have not happened yet.
- Material feasibility and reorder calculations avoid counting reserved plans twice.
- Sort controls are provided for material, product, BOM, and production schedule tables. Existing text search and schedule status filters remain.
- The root `src/` and `frontend/src/` trees are kept in sync because the repository contains both a root Vite/Express launch path and a separate `start.bat` frontend launch path.

## Tests run

Run from the project root:

```bash
PYTHONPATH=backend python -m unittest backend.tests.test_production_workflow -v
python -m compileall -q backend
tsc --noEmit --pretty false
tsc --noEmit --pretty false -p frontend/tsconfig.json
```

The nine new service-level workflow tests pass. A migration test against a temporary copy of the legacy backup also passed. The user's bundled database was not used for tests or modified.

Both root and frontend TypeScript checks pass. The full Flask integration suite and Vite bundle build were not run in this Linux review environment: Flask is not installed here, and the uploaded `node_modules` contains Windows-only native build binaries. Run those checks in the Windows project environment after installing the project's dependencies.

## Remaining schema rule

The existing database still has a `UNIQUE(product_id, date)` constraint. It therefore allows only one schedule row for a given product on a given date. This was retained to avoid a risky table rebuild and data migration. If multiple batches of the same product must be scheduled on the same day, that constraint needs a separate migration.
