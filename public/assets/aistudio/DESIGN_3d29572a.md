---
name: Agro-Industrial Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#44474d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#4a5f7f'
  primary: '#001229'
  on-primary: '#ffffff'
  primary-container: '#0f2744'
  on-primary-container: '#798fb1'
  inverse-primary: '#b2c8ed'
  secondary: '#4059aa'
  on-secondary: '#ffffff'
  secondary-container: '#8fa7fe'
  on-secondary-container: '#1d3989'
  tertiary: '#041223'
  on-tertiary: '#ffffff'
  tertiary-container: '#192739'
  on-tertiary-container: '#808ea4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#b2c8ed'
  on-primary-fixed: '#021c39'
  on-primary-fixed-variant: '#324866'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b6c4ff'
  on-secondary-fixed: '#00164e'
  on-secondary-fixed-variant: '#264191'
  tertiary-fixed: '#d5e3fc'
  tertiary-fixed-dim: '#b9c7df'
  on-tertiary-fixed: '#0d1c2e'
  on-tertiary-fixed-variant: '#3a485b'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-sm:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  data-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
  data-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers an operational, high-throughput Material Requirements Planning (MRP) interface tailored specifically for continuous potato chip processing and packaging lines. The system balances industrial grit with modern software ergonomics: it prioritizes immediate scanability, zero ambiguity under high-stress shift operations, and extreme numerical clarity.

The visual style is **Corporate / Modern utilitarian**, infused with structured data-dense ergonomics. It rejects extraneous decorative flourishes in favor of high-legibility typographic hierarchies, crisp grid bounds, and unmistakable operational states (sufficient, buffer caution, critical shortage). The interface evokes precision engineering, regulatory compliance, and rapid tactical decision-making for plant managers, procurement leads, and floor supervisors.

## Colors

The palette is engineered around clean industrial slate foundations paired with deterministic semantic signaling:

- **Canvas & Surfaces:**
  - App Canvas/Work area: `#F8FAFC` (Slate 50)
  - Surface Cards & Tables: `#FFFFFF` (Pure White)
  - Subtle Insets/Table Headers: `#F1F5F9` (Slate 100)
- **Primary & Interactive:**
  - Primary Brand/Key Structural Elements: `#0F2744` (Deep Industrial Navy)
  - Interactive Action/Selected Row Highlight: `#1E3A8A` (Deep Slate Blue)
  - Secondary Accents/Toolbar Chrome: `#475569` (Slate 600)
- **Dividers & Structural Rules:**
  - Borders & Grid Lines: `#E2E8F0` (Slate 200)
  - Focused Controls/Active Outlines: `#94A3B8` (Slate 400)
- **Typography:**
  - Headings & Primary Data: `#0F172A` (Slate 900)
  - Secondary Data/Labels: `#334155` (Slate 700)
  - Muted Metadata & Units: `#64748B` (Slate 500)
- **Deterministic Production & Inventory Status:**
  - **Sufficient Stock / Optimal:** `#16A34A` text on `#DCFCE7` background (Emerald 600 / 100)
  - **Threshold Caution / Exact Batch Fit:** `#D97706` text on `#FEF3C7` background (Amber 600 / 100)
  - **Procurement Critical / Line Halt Shortage:** `#DC2626` text on `#FEE2E2` background (Crimson 600 / 100)
  - **Scheduled / In-Transit:** `#2563EB` text on `#DBEAFE` background (Blue 600 / 100)

## Typography

Typography establishes an instant operational boundary between descriptive operational taxonomy and exact physical quantities:

- **Interface & UI Text (`Hanken Grotesk`):** Provides a contemporary, sharp geometric grotesque feel that stays clear and legible even at compact sizes in dense control panels, filter bars, and modal dialogs.
- **Tabular Data & Numerical Metrics (`JetBrains Mono`):** Applied strictly to quantities (kg, MT, bags, rolls), batch lot numbers, run-rate counters, yield percentages, lead times, and Indian Rupee (₹) currency calculations. Tabular alignment ensures vertical scanning without horizontal jitter.
- **Currency & Units Formatting:** The Indian Rupee symbol (`₹`) is rendered alongside monospace figures using standard Lakh/Crore grouping (e.g., `₹12,45,200.00`) or standard thousands notation depending on enterprise configuration. Trailing units (`MT`, `kg`, `µm`, `SKU`) are rendered in `data-mono-sm` colored in muted slate (`#64748B`).

## Layout & Spacing

This system utilizes a **Fluid Grid with Constrained Panels** designed primarily for wide enterprise desk monitors (1440px - 1920px+) found in dispatch control rooms and floor supervisor rugged terminals:

- **Grid Architecture:** 12-column responsive layout with fixed-width persistent navigation (compact rail: 64px, expanded: 240px). Gutters set to `1rem` for standard dashboard card arrangements and `0.5rem` for complex nested multi-column inventory tables.
- **Data Density:** Spacing favors compact vertical height to preserve vertical screen real estate. Table row heights are calibrated strictly between 36px (compact view) and 44px (default operational view).
- **Responsive Adaptations:**
  - **Desktop (>= 1280px):** Multi-column split views (e.g., Bill of Materials tree on left 35%, batch computation and raw stock allocation on right 65%).
  - **Tablet/Floor Terminal (768px - 1279px):** Collapses navigation to icon rail; side-by-side splits become stacked tabbed panels.
  - **Handheld / Mobile (< 768px):** Single-column stacked cards; horizontal tables scroll with pinned primary key column (e.g., Raw Material SKU / Batch Code).

## Elevation & Depth

Visual hierarchy is maintained primarily through **low-contrast outlines** and **subtle architectural tonal shifts** rather than dramatic shadows, minimizing visual clutter in data-heavy screens:

- **Base Canvas:** `#F8FAFC` provides the foundational layer.
- **Flat Containers / Surface Cards:** Placed at zero shadow elevation with a crisp 1px solid border of `#E2E8F0`.
- **Card Header Separation:** Segmented using a 1px bottom border of `#F1F5F9` and an optional `#F8FAFC` container title strip.
- **Hover & Active States:** Interactive table rows and actionable cards do not lift vertically; they transition background fill to `#F8FAFC` and introduce an interior active bar indicator (`#1E3A8A`).
- **Modals, Flyouts & Slide-over Drawers (Elevated Contexts):**
  - Ambient Shadow: `0 4px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04)`.
  - Pinned drawer and popover borders use `#CBD5E1` for distinct separation against bright background data grids.

## Shapes

The design uses **Soft (0.25rem / 4px base)** corner geometry (`roundedness: 1`). Industrial enterprise software demands structural rigidity and maximum usable interior area:

- **Form Fields, Buttons, Table Enclosures:** Rounded at `4px` (`0.25rem`). This provides crisp, stable edges that line up precisely against tabular columns and split layouts.
- **Status Badges & Pill Counters:** Micro badges may utilize `4px` or full pill curvature (`9999px`) strictly for quick-scan inventory health indicators.
- **Modals & Dialog Cards:** Rounded at `8px` (`0.5rem`, `rounded-lg`) to soften focal focal overlays without feeling casual.

## Components

### Buttons
- **Primary:** Background `#0F2744`, text `#FFFFFF`, 4px radius, compact padding (`8px 16px` for standard, `6px 12px` for table inline). Hover: `#1E3A8A`. Active: `#0A1B30`.
- **Secondary / Outline:** Background `#FFFFFF`, border `1px solid #CBD5E1`, text `#334155`. Hover: background `#F8FAFC`, border `#94A3B8`.
- **Destructive (Line Stop / Reject Lot):** Background `#DC2626`, text `#FFFFFF`. Hover: `#B91C1C`.
- **Ghost Action:** Background transparent, text `#475569`. Hover: `#F1F5F9`, text `#0F172A`.

### Status Badges & Chips
- **Sufficient Stock (Green):** Text `#16A34A`, background `#DCFCE7`, border `1px solid #BBF7D0`. Monospace quantity affixed (e.g., `[✓] 14,200 kg`).
- **Buffer Warning (Amber):** Text `#D97706`, background `#FEF3C7`, border `1px solid #FDE68A`. Indicates stock covers active shifts but falls below reorder point (e.g., `[!] 1,450 kg (Exact run)`).
- **Shortage Critical (Red):** Text `#DC2626`, background `#FEE2E2`, border `1px solid #FECACA`. Alerts procurement immediately (e.g., `[✕] -3,800 kg Deficit`).
- **Batch / Material Tag:** Text `#334155`, background `#F1F5F9`, border `1px solid #E2E8F0`, rendered in uppercase monospace.

### Data Tables (The Primary Operational Workhorse)
- **Header:** Background `#F8FAFC`, uppercase `label-sm` text `#475569`, border-bottom `2px solid #E2E8F0`. Height: 36px.
- **Cells:** Vertical alignment center, padding `8px 12px`, border-bottom `1px solid #F1F5F9`.
- **Alignment Rules:** Numerical quantities (weight, run time, waste %) and Currency (₹) are strictly right-aligned with monospace font. Material names, SKUs, and supplier codes are left-aligned. Status badges are centered.
- **Row Summary Footers:** Sticky bottom row with background `#F1F5F9` and bold `data-mono-md` totals.

### Form Controls & Inputs
- **Text & Numeric Inputs:** Height 36px, border `1px solid #CBD5E1`, background `#FFFFFF`, text `#0F172A`. Focus: border `1px solid #0F2744`, outline `2px solid rgba(15, 39, 68, 0.15)`.
- **Integrated Unit Addons:** Right-docked static unit badge (e.g., `[ 1,250 | kg ]`, `[ 0.08 | ₹/unit ]`) styled in background `#F8FAFC`, border-left `1px solid #CBD5E1`, text `#64748B`.
- **Field Labels:** `label-md` font weight 600 in `#334155`, positioned 4px above input. Optional helper and error text strictly below input in `11px`.

### Cards & Metrics (KPI Tiles)
- Surface background `#FFFFFF` bounded by `1px solid #E2E8F0`, padding `16px`.
- Layout: Top row contains micro-label and status chip; middle row displays large monospace metric (`data-mono-lg` / 24px) with unit; bottom row displays delta trend or allocation progress bar against current shift target.

### Domain-Specific Components
- **Bill of Materials (BOM) Explosion Tree:** Indented parent-child nodes showing raw potato grading, edible oil (palmolein/cottonseed), seasoning batches, and multi-layer film packaging rolls with shortage callout lines.
- **Batch Yield & Moisture Gauge:** Compact inline progress meter visualizing frying moisture target window (`1.5% - 1.8%`) with amber threshold caps.