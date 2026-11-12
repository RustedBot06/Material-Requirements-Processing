# Existing Database Audit — Read Before Demo

The database included in this archive was preserved byte-for-byte. The code changes do not attempt to repair or reinterpret its existing production history.

The active `backend/database/chips_mrp.db` contains five production-schedule rows, all marked `COMPLETED`, and zero active stock reservations. Some of these records are internally inconsistent:

- Schedule #14 has a production date of `2026-11-13`, which is in the future relative to the archive date `2026-11-12`, but it is already marked `COMPLETED` with 4,100 actual packets.
- Schedule #12's material snapshot records 580,000 units of potatoes. Its current BOM and actual output imply 156.6 units.
- Schedule #13's potato snapshot records 422,400 units; its current BOM and actual output imply 249.6 units.
- Schedule #14's potato snapshot records 360,800 units; its current BOM and actual output imply 213.2 units.
- The movement ledger has a production-consumption entry referring to schedule #17, but no schedule #17 exists. The five visible completed schedules (#11–#15) have no corresponding production-consumption movements.
- The current physical palm-oil stock is 501 L, while the current BOM quantities for completed schedules #11 and #15 alone imply 1,122.128 L of palm-oil consumption. The ledger does not record those deductions.

The separate `.bak` database is an older schema backup. It contains the same five schedule rows but lacks the newer reservation, movement and batch-cost tables. It is not a reliable replacement for the active database.

**Do not use these existing rows as verified manufacturing history or as proof that the inventory ledger reconciles.** The application code now records new completed runs consistently, but old records require manual review against the actual source records. No old row, ID, stock balance or snapshot has been deleted or rewritten by this patch.
