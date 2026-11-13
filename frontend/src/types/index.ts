export interface Material {
  id: number;
  material_name: string;
  unit: string;
  stock_qty: number;
  cost_per_unit: number;
  min_stock_threshold?: number;
  reserved_qty?: number;
  available_qty?: number;
  is_low_stock?: boolean;
}

export interface Product {
  id: number;
  name: string;
  packet_size: number;
  stock_qty: number;
  mrp: number;
}

export interface BOMEntry {
  id: number;
  product_id: number;
  material_id: number;
  qty_required: number;
  cost: number;
  product_name: string;
  packet_size: number;
  material_name: string;
  unit: string;
  cost_per_unit: number;
}

export interface ScheduleEntry {
  id: number;
  product_id: number;
  date: string;
  planned_qty: number;
  actual_qty: number;
  product_name: string;
  packet_size: number;
  status?: 'SCHEDULED' | 'AT_RISK' | 'COMPLETED' | 'CANCELLED';
  material_shortages?: Array<{ material_id: number; material_name: string; unit: string; required_qty: number; available_qty: number; shortage_qty: number }>;
  total_cost?: number;
  unit_cost?: number;
  created_at?: string;
  completed_at?: string | null;
}

export interface BatchMaterialUsage {
  id: number;
  schedule_id: number;
  material_id: number;
  material_name: string;
  unit: string;
  material_unit?: string;
  unit_cost: number;
  qty_used: number;
  total_cost: number;
  cost_share_pct?: number;
}

export interface BatchCostBreakdown {
  schedule_id: number;
  date: string;
  product_id: number;
  product_name: string;
  packet_size: number;
  planned_qty: number;
  actual_qty: number;
  status: string;
  cost_type?: 'CURRENT_ESTIMATE' | 'ACTUAL_HISTORICAL' | 'LEGACY_UNVERIFIED' | 'HISTORICAL_SNAPSHOT_MISSING';
  cost_note?: string;
  total_material_cost: number;
  unit_material_cost: number;
  completed_at?: string | null;
  materials: BatchMaterialUsage[];
}

export interface CostTrendPoint {
  schedule_id: number;
  date: string;
  product_id: number;
  product_name: string;
  packet_size: number;
  actual_qty: number;
  planned_qty: number;
  total_cost: number;
  unit_cost: number;
  completed_at?: string | null;
  cost_source?: 'ACTUAL_HISTORICAL' | 'LEGACY_UNVERIFIED';
}

export interface StockMovement {
  id: number;
  material_id: number;
  material_name: string;
  unit: string;
  movement_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  reference_id?: number | null;
  created_at: string;
}

export interface LowStockAlert {
  material_id: number;
  material_name: string;
  unit: string;
  physical_stock: number;
  reserved_qty: number;
  available_qty: number;
  min_stock_threshold: number;
  deficit: number;
  urgency: 'CRITICAL' | 'WARNING';
  message: string;
}

export interface ReorderSuggestion {
  material_id: number;
  material_name: string;
  unit: string;
  physical_stock: number;
  reserved_stock: number;
  available_stock: number;
  min_stock_threshold: number;
  suggested_purchase_qty: number;
  unit_cost: number;
  estimated_cost: number;
  status: string;
  reorder_needed: boolean;
}

export interface FeasibilityItem {
  material_id: number;
  material_name: string;
  unit: string;
  physical_stock?: number;
  reserved_stock?: number;
  available_stock: number;
  required_qty: number;
  shortage: number;
  surplus: number;
  procurement_qty: number;
  status: string;
}

export interface DashboardData {
  products: Product[];
  materials: Material[];
  recent_schedules: ScheduleEntry[];
  perf_data: Array<{
    date: string;
    planned_qty: number;
    actual_qty: number;
    variance?: number;
    shortfall: number;
    surplus?: number;
    achievement: number;
  }>;
  material_perf: {
    material_id: number;
    material_name: string;
    unit: string;
    stock_qty: number;
    reserved_qty?: number;
    available_qty?: number;
    cost_per_unit: number;
    daily_requirements: Array<{
      date: string;
      gross_requirement: number;
    }>;
  } | null;
  selected_product_name: string | null;
  selected_product_id: number | null;
  selected_material_id: number | null;
  start_date?: string | null;
  end_date?: string | null;
  total_planned: number;
  total_actual: number;
  total_shortfall: number;
  total_surplus?: number;
  overall_achievement: number;
  total_inventory_val: number;
  raw_materials_count: number;
  low_stock_count?: number;
  active_reservations_count?: number;
}

// Analytics Type Definitions
export interface ProductionComparisonPoint {
  date: string;
  planned_qty: number;
  actual_qty: number;
  variance: number;
  shortfall?: number;
  surplus?: number;
  achievement_pct: number;
}

export interface ProductionComparisonResponse {
  metric: string;
  chart_type: string;
  product_id?: number | null;
  selected_product?: {
    id: number;
    name: string;
    packet_size: number;
    display_name: string;
  } | null;
  start_date?: string | null;
  end_date?: string | null;
  summary: {
    total_planned: number;
    total_actual: number;
    net_variance: number;
    overall_achievement_pct: number;
    record_count: number;
  };
  data: ProductionComparisonPoint[];
}

export interface ProductionShortfallPoint {
  date: string;
  actual_qty: number;
  planned_qty: number;
  variance?: number;
  shortfall: number;
  surplus?: number;
  shortfall_pct: number;
  status?: string;
}

export interface ProductionShortfallResponse {
  metric: string;
  chart_type: string;
  product_id?: number | null;
  selected_product?: {
    id: number;
    name: string;
    packet_size: number;
    display_name: string;
  } | null;
  start_date?: string | null;
  end_date?: string | null;
  summary: {
    total_actual: number;
    total_planned?: number;
    total_shortfall: number;
    total_surplus?: number;
    net_variance?: number;
    days_with_shortfall: number;
    days_with_surplus?: number;
    peak_shortfall: number;
    peak_shortfall_date: string | null;
    average_daily_shortfall: number;
    shortfall_rate_pct: number;
    record_count: number;
  };
  data: ProductionShortfallPoint[];
}

export interface MaterialInventoryResponse {
  metric: string;
  historical_data_available: boolean;
  chart_type: string;
  material_id?: number | null;
  selected_material?: Material | null;
  start_date?: string | null;
  end_date?: string | null;
  diagnostic_note?: string;
  missing_schema_requirements?: string[];
  summary?: {
    total_procurement_inflow: number;
    total_consumption_outflow: number;
    total_adjustment_outflow?: number;
    net_flow: number;
    record_count: number;
  };
  current_stock_summary: {
    material_name: string;
    unit: string;
    on_hand_stock: number;
    reserved_stock?: number;
    available_stock?: number;
    min_stock_threshold?: number;
    cost_per_unit: number;
    total_valuation_inr: number;
    total_scheduled_demand: number;
    projected_buffer: number;
    adequacy_status: string;
  };
  data: Array<{
    date: string;
    procurement_qty: number;
    opening_balance_qty?: number;
    consumption_qty?: number;
    adjustment_outflow?: number;
    remaining_stock: number;
  }>;
}

export type TabType = 'dashboard' | 'analytics' | 'materials' | 'products' | 'bom' | 'schedule' | 'feasibility';
