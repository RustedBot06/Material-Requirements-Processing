import {
  Material,
  Product,
  BOMEntry,
  ScheduleEntry,
  FeasibilityItem,
  DashboardData,
  ProductionComparisonResponse,
  ProductionShortfallResponse,
  MaterialInventoryResponse,
  StockMovement,
  LowStockAlert,
  ReorderSuggestion,
  BatchCostBreakdown,
  CostTrendPoint,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMessage = `HTTP Error ${res.status}`;
    try {
      const errorData = await res.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      errorMessage = res.statusText || errorMessage;
    }
    throw new ApiError(errorMessage, res.status);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // System Health
  async getHealth(): Promise<{ status: string; backend: string; database: any }> {
    return request('/health');
  },

  // Dashboard
  async getDashboard(params?: {
    productId?: number;
    materialId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<DashboardData> {
    const q = new URLSearchParams();
    if (params?.productId) q.set('product_id', String(params.productId));
    if (params?.materialId) q.set('material_id', String(params.materialId));
    if (params?.startDate) q.set('start_date', params.startDate);
    if (params?.endDate) q.set('end_date', params.endDate);
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return request(`/dashboard${queryString}`);
  },

  // Materials
  async getMaterials(): Promise<Material[]> {
    return request('/materials');
  },

  async getMaterial(id: number): Promise<Material> {
    return request(`/materials/${id}`);
  },

  async getLowStockAlerts(): Promise<LowStockAlert[]> {
    return request('/materials/alerts');
  },

  async getReorderSuggestions(): Promise<ReorderSuggestion[]> {
    return request('/materials/reorder-suggestions');
  },

  async getStockMovements(materialId?: number, limit = 100): Promise<StockMovement[]> {
    const q = new URLSearchParams();
    if (materialId) q.set('material_id', String(materialId));
    if (limit) q.set('limit', String(limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request(`/materials/movements${qs}`);
  },

  async adjustStock(
    materialId: number,
    data: {
      adjustment_type: 'INCREASE' | 'DECREASE';
      quantity: number;
      reason: string;
    }
  ): Promise<{ success: boolean; message: string; data: any }> {
    return request(`/materials/${materialId}/adjust`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createMaterial(data: {
    material_name: string;
    unit: string;
    stock_qty: number;
    cost_per_unit: number;
    min_stock_threshold?: number;
  }): Promise<{ success: boolean; id: number; status: 'SCHEDULED' | 'AT_RISK'; message: string }> {
    return request('/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateMaterial(
    id: number,
    data: {
      material_name: string;
      unit: string;
      stock_qty: number;
      cost_per_unit: number;
      min_stock_threshold?: number;
    }
  ): Promise<{ success: boolean; message: string }> {
    return request(`/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteMaterial(id: number): Promise<{ success: boolean; message: string }> {
    return request(`/materials/${id}`, {
      method: 'DELETE',
    });
  },

  // Products
  async getProducts(): Promise<Product[]> {
    return request('/products');
  },

  async getProduct(id: number): Promise<Product> {
    return request(`/products/${id}`);
  },

  async createProduct(data: {
    name: string;
    packet_size: number;
    stock_qty: number;
    mrp: number;
  }): Promise<{ success: boolean; id: number; message: string }> {
    return request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProduct(
    id: number,
    data: {
      name: string;
      packet_size: number;
      stock_qty: number;
      mrp: number;
    }
  ): Promise<{ success: boolean; message: string }> {
    return request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteProduct(id: number): Promise<{ success: boolean; message: string }> {
    return request(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // BOM
  async getBOM(): Promise<BOMEntry[]> {
    return request('/bom');
  },

  async createBOM(data: {
    product_id: number;
    material_id: number;
    qty_required: number;
  }): Promise<{ success: boolean; id: number; message: string }> {
    return request('/bom', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateBOM(
    id: number,
    data: { qty_required: number }
  ): Promise<{ success: boolean; message: string }> {
    return request(`/bom/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteBOM(id: number): Promise<{ success: boolean; message: string }> {
    return request(`/bom/${id}`, {
      method: 'DELETE',
    });
  },

  // Production Schedule & Reservations
  async getSchedules(): Promise<ScheduleEntry[]> {
    return request('/schedule');
  },

  async createSchedule(data: {
    product_id: number;
    date: string;
    planned_qty: number;
    actual_qty: number;
  }): Promise<{ success: boolean; id: number; status: 'SCHEDULED' | 'AT_RISK'; message: string }> {
    return request('/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reserveSchedule(id: number): Promise<{ success: boolean; status: string; message: string }> {
    return request(`/schedule/${id}/reserve`, { method: 'POST' });
  },

  async completeSchedule(
    id: number,
    actualQty?: number
  ): Promise<{ success: boolean; message: string; data: any }> {
    return request(`/schedule/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(actualQty !== undefined ? { actual_qty: actualQty } : {}),
    });
  },

  async cancelSchedule(id: number): Promise<{ success: boolean; message: string }> {
    return request(`/schedule/${id}/cancel`, {
      method: 'POST',
    });
  },

  async getScheduleCostBreakdown(id: number): Promise<BatchCostBreakdown> {
    return request(`/schedule/${id}/cost-breakdown`);
  },

  async getCostTrends(productId?: number): Promise<CostTrendPoint[]> {
    const qs = productId ? `?product_id=${productId}` : '';
    return request(`/production/cost-trends${qs}`);
  },

  async updateSchedule(
    id: number,
    data: {
      date: string;
      planned_qty: number;
      actual_qty: number;
    }
  ): Promise<{ success: boolean; message: string }> {
    return request(`/schedule/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteSchedule(id: number): Promise<{ success: boolean; message: string }> {
    return request(`/schedule/${id}`, {
      method: 'DELETE',
    });
  },

  // Feasibility
  async getFeasibility(
    startDate: string,
    endDate: string
  ): Promise<{ start_date: string; end_date: string; report: FeasibilityItem[] }> {
    return request(`/feasibility?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`);
  },

  // Analytics Endpoints
  async getProductionComparison(params?: {
    productId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ProductionComparisonResponse> {
    const q = new URLSearchParams();
    if (params?.productId) q.set('product_id', String(params.productId));
    if (params?.startDate) q.set('start_date', params.startDate);
    if (params?.endDate) q.set('end_date', params.endDate);
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return request(`/analytics/production-comparison${queryString}`);
  },

  async getProductionShortfall(params?: {
    productId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ProductionShortfallResponse> {
    const q = new URLSearchParams();
    if (params?.productId) q.set('product_id', String(params.productId));
    if (params?.startDate) q.set('start_date', params.startDate);
    if (params?.endDate) q.set('end_date', params.endDate);
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return request(`/analytics/production-shortfall${queryString}`);
  },

  async getMaterialInventory(params?: {
    materialId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<MaterialInventoryResponse> {
    const q = new URLSearchParams();
    if (params?.materialId) q.set('material_id', String(params.materialId));
    if (params?.startDate) q.set('start_date', params.startDate);
    if (params?.endDate) q.set('end_date', params.endDate);
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return request(`/analytics/material-inventory${queryString}`);
  },
};
