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
- **Sufficient Stock (Green):** Text `#16A34A`, background `#DCFCE7`, border `1px solid #BBF7D0`. Monospace quantity affixed (e.g., `X�$�HM���
K��H
���Y��\��\��[��
[X�\�N���^�M����X��ܛ�[�ёQ�����ܙ\�\��YёM�X�[�X�]\������ݙ\��X�]�H�Y���]�[��[���[ܙ\��[�
K�ˋ�WHKL��
^X��[�X
K��H
���ܝY�Hܚ]X�[
�Y
N���^�̍����X��ܛ�[�ёQL�L��ܙ\�\��YёP�P�X�[\�����\�[Y[�[[YYX][H
K�ˋ)�U��2Ã�rFVf�6�F�����&F6���FW&��Fs���FW�B333CSV�&6�w&�V�B4ccTc��&�&FW"�6�ƖB4S$S�c�&V�FW&VB��WW&66R����76Rࠢ222FFF&�W2�F�R&��'��W&F����v�&���'6R������VFW#���&6�w&�V�B4c�dd6�WW&66R�&V��6�FW�B3CsSSc��&�&FW"�&�GF��'�6�ƖB4S$S�c��V�v�C�3g�����6V��3���fW'F�6�Ɩv��V�B6V�FW"�FF��r��'��&�&FW"�&�GF���6�ƖB4ccTc�����Ɩv��V�B'V�W3����V�W&�6�V�F�F�W2�vV�v�B�'V�F��R�v7FRR��B7W'&V�7��(+��&R7G&�7Fǒ&�v�B�Ɩv�VBv�F�����76Rf��B��FW&����W2�4�W2��B7WƖW"6�FW2&R�VgB�Ɩv�VB�7FGW2&FvW2&R6V�FW&VB����&�r7V��'�f��FW'3���7F�6��&�GF��&�rv�F�&6�w&�V�B4ccTc��B&��BFF�������FF�F�2ࠢ222f�&�6��G&��2b��WG0����FW�Bb�V�W&�2��WG3����V�v�B3g��&�&FW"�6�ƖB44$CTS�&6�w&�V�B4dddddf�FW�B3cs$�f�7W3�&�&FW"�6�ƖB3c#sCF��WFƖ�R'�6�ƖB&v&�R�3��c���R�������FVw&FVBV�BFF��3���&�v�B�F�6�VB7FF�2V�B&FvR�R�r����#S��r������(+��V�B��7G��VB��&6�w&�V�B4c�dd6�&�&FW"��VgB�6�ƖB44$CTS�FW�B3cCsC�&����f�V�B�&V�3����&V���Ff��BvV�v�Bc��333CSV��6�F���VBG�&�fR��WB��F�����V�W"�BW'&�"FW�B7G&�7Fǒ&V��r��WB���ࠢ2226&G2b�WG&�72���F��W2���7W&f6R&6�w&�V�B4dddddf&�V�FVB'��6�ƖB4S$S�c�FF��rg������WC�F�&�r6��F��2֖7&���&V��B7FGW26���֖FF�R&�rF�7��2�&vR����76R�WG&�2�FF�������v�#G��v�F�V�C�&�GF��&�rF�7��2FV�FG&V�B�"���6F���&�w&W72&"v��7B7W'&V�B6��gBF&vWBࠢ222F�����7V6�f�26����V�G0����&����b�FW&��2�$�ҒW���6���G&VS�����FV�FVB&V�B�6���B��FW26��v��r&r�FF�w&F��r�VF�&�R��������V���6�GF��6VVB��6V6���r&F6�W2��B�V�F����W"f���6�v��r&���2v�F�6��'FvR6���WBƖ�W2����&F6���V�Bb���7GW&RvVvS���6��7B��Ɩ�R&�w&W72�WFW"f�7VƗ���rg'���r���7GW&RF&vWBv��F�r��RR��V�v�F��&W"F�&W6���B62