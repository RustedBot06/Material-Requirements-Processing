import React, { useState, useEffect } from 'react';
import {
  Factory,
  Layers,
  Package,
  Calendar,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Search,
  Scale,
  User,
  X,
  AlertTriangle,
  ChevronRight,
  Printer,
  Download,
  AlertCircle,
  TrendingUp,
  ArrowUpDown,
  History,
  ShoppingCart,
  Coins,
  Check,
  Ban,
  Sliders,
  Info,
} from 'lucide-react';
import { api } from './services/api';
import { Analytics } from './pages/Analytics';
import {
  Material,
  Product,
  BOMEntry,
  ScheduleEntry,
  FeasibilityItem,
  DashboardData,
  StockMovement,
  LowStockAlert,
  ReorderSuggestion,
  BatchCostBreakdown,
  TabType,
} from './types';

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getSevenDaysAgoString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; title?: string } | null>(null);

  // Dashboard Data & Filters
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedProductFilter, setSelectedProductFilter] = useState<number | undefined>(undefined);
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<number | undefined>(undefined);
  const [dashboardStartDate, setDashboardStartDate] = useState<string>('');
  const [dashboardEndDate, setDashboardEndDate] = useState<string>('');
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  // Master Data
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bomList, setBomList] = useState<BOMEntry[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);

  // MRP Features State
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [adjustingMaterial, setAdjustingMaterial] = useState<Material | null>(null);
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [completingSchedule, setCompletingSchedule] = useState<ScheduleEntry | null>(null);
  const [cancellingSchedule, setCancellingSchedule] = useState<ScheduleEntry | null>(null);
  const [viewingCostBreakdown, setViewingCostBreakdown] = useState<BatchCostBreakdown | null>(null);

  // Table Filters & Search
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialSortCol, setMaterialSortCol] = useState<'id' | 'name' | 'stock' | 'avail' | 'cost'>('id');
  const [materialSortAsc, setMaterialSortAsc] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [productSortCol, setProductSortCol] = useState<'id' | 'name' | 'size' | 'stock' | 'mrp'>('id');
  const [productSortAsc, setProductSortAsc] = useState(true);
  const [bomSearch, setBomSearch] = useState('');
  const [bomSortCol, setBomSortCol] = useState<'id' | 'product' | 'material' | 'qty' | 'cost'>('id');
  const [bomSortAsc, setBomSortAsc] = useState(true);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'AT_RISK' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [scheduleSortCol, setScheduleSortCol] = useState<'id' | 'date' | 'product' | 'planned' | 'actual' | 'variance' | 'status' | 'total_cost' | 'unit_cost'>('date');
  const [scheduleSortAsc, setScheduleSortAsc] = useState(false);

  // Feasibility State
  const [feasibilityStartDate, setFeasibilityStartDate] = useState(getSevenDaysAgoString());
  const [feasibilityEndDate, setFeasibilityEndDate] = useState(getTodayString());
  const [feasibilityReport, setFeasibilityReport] = useState<FeasibilityItem[] | null>(null);
  const [loadingFeasibility, setLoadingFeasibility] = useState(false);

  // Modals for CRUD
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);

  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const [isAddBOMModalOpen, setIsAddBOMModalOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BOMEntry | null>(null);
  const [deletingBOM, setDeletingBOM] = useState<BOMEntry | null>(null);

  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleEntry | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<ScheduleEntry | null>(null);

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[now.getMonth()];
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${dd} ${month} • ${hh}:${mm}:${ss} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Flash Toast Auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' = 'success', title?: string) => {
    setToast({ message, type, title });
  };

  // API Fetchers
  const fetchDashboard = async (
    prodId = selectedProductFilter,
    matId = selectedMaterialFilter,
    startDate = dashboardStartDate,
    endDate = dashboardEndDate
  ) => {
    try {
      const data = await api.getDashboard({
        productId: prodId,
        materialId: matId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setDashboardData(data);
      if (data.materials.length > 0 && !selectedMaterialFilter && !matId) {
        setSelectedMaterialFilter(data.materials[0].id);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const fetchMaterials = async () => {
    try {
      const data = await api.getMaterials();
      setMaterials(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const fetchLowStockAlerts = async () => {
    try {
      const data = await api.getLowStockAlerts();
      setLowStockAlerts(data);
    } catch (err: any) {
      console.error('Failed to fetch low stock alerts', err);
    }
  };

  const fetchReorderSuggestions = async () => {
    try {
      const data = await api.getReorderSuggestions();
      setReorderSuggestions(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const fetchMovements = async (materialId?: number) => {
    try {
      const data = await api.getStockMovements(materialId);
      setStockMovements(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const fetchBOM = async () => {
    try {
      const data = await api.getBOM();
      setBomList(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const fetchSchedules = async () => {
    try {
      const data = await api.getSchedules();
      setSchedules(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const fetchFeasibility = async (start = feasibilityStartDate, end = feasibilityEndDate) => {
    setLoadingFeasibility(true);
    try {
      const data = await api.getFeasibility(start, end);
      setFeasibilityReport(data.report);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoadingFeasibility(false);
    }
  };

  const refreshAllMasterData = () => {
    fetchDashboard(selectedProductFilter, selectedMaterialFilter, dashboardStartDate, dashboardEndDate);
    fetchMaterials();
    fetchLowStockAlerts();
    fetchProducts();
    fetchBOM();
    fetchSchedules();
    fetchFeasibility(feasibilityStartDate, feasibilityEndDate);
  };

  useEffect(() => {
    refreshAllMasterData();
  }, []);

  const handleProductFilterChange = (prodId?: number) => {
    setSelectedProductFilter(prodId);
    fetchDashboard(prodId, selectedMaterialFilter, dashboardStartDate, dashboardEndDate);
  };

  const handleMaterialFilterChange = (matId: number) => {
    setSelectedMaterialFilter(matId);
    fetchDashboard(selectedProductFilter, matId, dashboardStartDate, dashboardEndDate);
  };

  const handleDashboardDateFilter = (start: string, end: string) => {
    setDashboardStartDate(start);
    setDashboardEndDate(end);
    fetchDashboard(selectedProductFilter, selectedMaterialFilter, start, end);
  };

  const exportShiftReport = () => {
    let csv = 'Chips MRP - Shift Production & Inventory Report\n';
    csv += `Generated at: ${new Date().toISOString()}\n\n`;
    csv += 'SCHEDULED PRODUCTION RUNS\n';
    csv += 'ID,Date,Product Name,Planned Packets,Actual Packets,Variance,Status,Total Batch Cost\n';
    schedules.forEach((s) => {
      const sf = s.planned_qty - s.actual_qty;
      csv += `${s.id},"${s.date}","${s.product_name} - ${s.packet_size}g",${s.planned_qty},${s.actual_qty},${s.actual_qty - s.planned_qty},"${s.status || 'COMPLETED'}",${s.total_cost || 0}\n`;
    });
    csv += '\nRAW MATERIAL INVENTORY STATUS\n';
    csv += 'ID,Material Name,Unit,Physical Stock,Reserved Stock,Available Stock,Min Safety Threshold,Cost Per Unit (INR),Total Valuation (INR)\n';
    materials.forEach((m) => {
      const avail = m.available_qty !== undefined ? m.available_qty : m.stock_qty - (m.reserved_qty || 0);
      csv += `${m.id},"${m.material_name}","${m.unit}",${m.stock_qty},${m.reserved_qty || 0},${avail},${m.min_stock_threshold || 0},${m.cost_per_unit},${m.stock_qty * m.cost_per_unit}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Chips_MRP_Production_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('MRP Report downloaded as CSV', 'success', 'Export Completed:');
  };

  const exportFeasibilityReport = () => {
    if (!feasibilityReport || feasibilityReport.length === 0) {
      showToast('No feasibility report generated yet to export', 'error', 'Export Notice:');
      return;
    }
    let csv = `Material Feasibility Report (${feasibilityStartDate} to ${feasibilityEndDate})\n\n`;
    csv += 'Material ID,Material Name,Unit,Available Stock,Required Qty,Shortage,Surplus,Suggested Procurement,Status\n';
    feasibilityReport.forEach((r) => {
      csv += `${r.material_id},"${r.material_name}","${r.unit}",${r.available_stock},${r.required_qty},${r.shortage},${r.surplus},${r.procurement_qty},"${r.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Material_Feasibility_${feasibilityStartDate}_to_${feasibilityEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Feasibility Requisition downloaded as CSV', 'success', 'Export Completed:');
  };

  // Dynamic Shortfall Bars directly from database records
  const shortfallBars = (dashboardData?.perf_data || []).map((r) => {
    const d = new Date(r.date + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${d.getDate()} ${months[d.getMonth()]}`;
    return {
      date: formattedDate,
      fullDate: r.date,
      planned: r.planned_qty,
      actual: r.actual_qty,
      shortfall: Math.max(0, r.shortfall),
      ach: r.planned_qty > 0 ? ((r.actual_qty / r.planned_qty) * 100).toFixed(1) : '0.0',
    };
  });

  // Dynamic Daily Demand items for selected material directly from database BOM calculation
  const dailyDemands = (dashboardData?.material_perf?.daily_requirements || []).map((d) => {
    const dt = new Date(d.date + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${dt.getDate()} ${months[dt.getMonth()]}`;
    const allReqs = (dashboardData?.material_perf?.daily_requirements || []).map((x) => x.gross_requirement);
    const maxReq = Math.max(...allReqs, 1);
    return {
      date: formattedDate,
      fullDate: d.date,
      req: Number(d.gross_requirement.toFixed(1)),
      pct: Math.min(100, Math.round((d.gross_requirement / maxReq) * 100)),
    };
  });

  // Dynamic SVG Points for Planned vs Actual Production Curve Chart
  const perfData = dashboardData?.perf_data || [];
  const maxOutputVal = Math.max(...perfData.map((p) => Math.max(p.planned_qty, p.actual_qty)), 1000) * 1.15;

  const chartPoints = perfData.map((p, idx) => {
    const width = 540;
    const height = 180;
    const paddingLeft = 45;
    const paddingRight = 35;
    const paddingTop = 25;
    const paddingBottom = 30;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const x = perfData.length > 1 ? paddingLeft + idx * (chartWidth / (perfData.length - 1)) : width / 2;
    const yPlanned = height - paddingBottom - (p.planned_qty / maxOutputVal) * chartHeight;
    const yActual = height - paddingBottom - (p.actual_qty / maxOutputVal) * chartHeight;

    const d = new Date(p.date + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = `${d.getDate()} ${months[d.getMonth()]}`;

    return { x, yPlanned, yActual, label, ...p };
  });

  let actualLineD = '';
  let actualAreaD = '';
  let plannedLineD = '';

  if (chartPoints.length > 0) {
    actualLineD =
      `M ${chartPoints[0].x},${chartPoints[0].yActual}` +
      chartPoints
        .slice(1)
        .map((pt, i) => {
          const prev = chartPoints[i];
          const cp1x = prev.x + (pt.x - prev.x) / 2;
          const cp2x = cp1x;
          return ` C ${cp1x},${prev.yActual} ${cp2x},${pt.yActual} ${pt.x},${pt.yActual}`;
        })
        .join('');

    const lastPt = chartPoints[chartPoints.length - 1];
    actualAreaD = `${actualLineD} L ${lastPt.x},155 L ${chartPoints[0].x},155 Z`;

    plannedLineD =
      `M ${chartPoints[0].x},${chartPoints[0].yPlanned}` +
      chartPoints
        .slice(1)
        .map((pt, i) => {
          const prev = chartPoints[i];
          const cp1x = prev.x + (pt.x - prev.x) / 2;
          const cp2x = cp1x;
          return ` C ${cp1x},${prev.yPlanned} ${cp2x},${pt.yPlanned} ${pt.x},${pt.yPlanned}`;
        })
        .join('');
  }

  // Active Material Requirements
  const currentMaterial = materials.find((m) => m.id === selectedMaterialFilter) || materials[0];
  const matPerf = dashboardData?.material_perf;
  const matStock = matPerf ? matPerf.stock_qty : (currentMaterial?.stock_qty || 0);
  const matUnit = matPerf ? matPerf.unit : (currentMaterial?.unit || 'kg');
  const matName = matPerf ? matPerf.material_name : (currentMaterial?.material_name || 'Raw Material');
  const scheduledReq = (matPerf?.daily_requirements || []).reduce((acc: number, d: any) => acc + d.gross_requirement, 0);
  const bufferVal = matStock - scheduledReq;
  const scheduledCapPct = matStock > 0 ? Math.min(100, Math.max(1, (scheduledReq / matStock) * 100)) : 0;

  // Filtered & Sorted Materials
  const filteredMaterials = materials
    .filter((m) => m.material_name.toLowerCase().includes(materialSearch.toLowerCase()))
    .sort((a, b) => {
      let vA: any = a.id;
      let vB: any = b.id;
      if (materialSortCol === 'name') {
        vA = a.material_name.toLowerCase();
        vB = b.material_name.toLowerCase();
      } else if (materialSortCol === 'stock') {
        vA = a.stock_qty;
        vB = b.stock_qty;
      } else if (materialSortCol === 'avail') {
        vA = a.available_qty ?? a.stock_qty;
        vB = b.available_qty ?? b.stock_qty;
      } else if (materialSortCol === 'cost') {
        vA = a.cost_per_unit;
        vB = b.cost_per_unit;
      }
      if (vA < vB) return materialSortAsc ? -1 : 1;
      if (vA > vB) return materialSortAsc ? 1 : -1;
      return 0;
    });

  const compareSortValues = (left: string | number, right: string | number) =>
    typeof left === 'number' && typeof right === 'number'
      ? left - right
      : String(left).localeCompare(String(right), undefined, { numeric: true });

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase())).sort((a, b) => {
    const values: Record<typeof productSortCol, [string | number, string | number]> = {
      id: [a.id, b.id], name: [a.name.toLowerCase(), b.name.toLowerCase()], size: [a.packet_size, b.packet_size],
      stock: [a.stock_qty, b.stock_qty], mrp: [a.mrp, b.mrp],
    };
    const [left, right] = values[productSortCol];
    const result = compareSortValues(left, right);
    return productSortAsc ? result : -result;
  });

  const filteredBOM = bomList.filter((b) =>
    b.product_name.toLowerCase().includes(bomSearch.toLowerCase()) ||
    b.material_name.toLowerCase().includes(bomSearch.toLowerCase())
  ).sort((a, b) => {
    const values: Record<typeof bomSortCol, [string | number, string | number]> = {
      id: [a.id, b.id], product: [a.product_name.toLowerCase(), b.product_name.toLowerCase()],
      material: [a.material_name.toLowerCase(), b.material_name.toLowerCase()], qty: [a.qty_required, b.qty_required], cost: [a.cost, b.cost],
    };
    const [left, right] = values[bomSortCol];
    const result = compareSortValues(left, right);
    return bomSortAsc ? result : -result;
  });

  const productSortHeader = (label: string, key: typeof productSortCol, align = 'left') => (
    <button type="button" onClick={() => {
      if (productSortCol === key) setProductSortAsc((v) => !v);
      else { setProductSortCol(key); setProductSortAsc(true); }
    }} className={`inline-flex items-center gap-1 hover:text-[#001229] ${align === 'right' ? 'justify-end w-full' : ''}`}>
      {label}<ArrowUpDown className={`w-3 h-3 ${productSortCol === key ? 'text-[#4059aa]' : 'text-slate-400'}`} />
    </button>
  );

  const bomSortHeader = (label: string, key: typeof bomSortCol, align = 'left') => (
    <button type="button" onClick={() => {
      if (bomSortCol === key) setBomSortAsc((v) => !v);
      else { setBomSortCol(key); setBomSortAsc(true); }
    }} className={`inline-flex items-center gap-1 hover:text-[#001229] ${align === 'right' ? 'justify-end w-full' : ''}`}>
      {label}<ArrowUpDown className={`w-3 h-3 ${bomSortCol === key ? 'text-[#4059aa]' : 'text-slate-400'}`} />
    </button>
  );

  // Filtered Schedules
  const filteredSchedules = schedules.filter((s) => {
    const status = (s.status || (s.actual_qty > 0 ? 'COMPLETED' : 'AT_RISK')).toUpperCase();
    if (scheduleStatusFilter !== 'ALL' && status !== scheduleStatusFilter) return false;
    if (scheduleSearch) {
      const q = scheduleSearch.toLowerCase();
      return s.product_name.toLowerCase().includes(q) || s.date.includes(q) || String(s.id).includes(q);
    }
    return true;
  }).sort((a, b) => {
    const statusA = (a.status || (a.actual_qty > 0 ? 'COMPLETED' : 'AT_RISK')).toUpperCase();
    const statusB = (b.status || (b.actual_qty > 0 ? 'COMPLETED' : 'AT_RISK')).toUpperCase();
    const values: Record<typeof scheduleSortCol, [string | number, string | number]> = {
      id: [a.id, b.id], date: [a.date, b.date], product: [a.product_name.toLowerCase(), b.product_name.toLowerCase()],
      planned: [a.planned_qty, b.planned_qty], actual: [a.actual_qty, b.actual_qty],
      variance: [a.actual_qty - a.planned_qty, b.actual_qty - b.planned_qty],
      status: [statusA, statusB], total_cost: [a.total_cost ?? 0, b.total_cost ?? 0],
      unit_cost: [a.unit_cost ?? 0, b.unit_cost ?? 0],
    };
    const [left, right] = values[scheduleSortCol];
    const result = compareSortValues(left, right);
    return scheduleSortAsc ? result : -result;
  });

  const scheduleSortHeader = (label: string, key: typeof scheduleSortCol, align = 'left') => (
    <button type="button" onClick={() => {
      if (scheduleSortCol === key) setScheduleSortAsc((v) => !v);
      else { setScheduleSortCol(key); setScheduleSortAsc(true); }
    }} className={`inline-flex items-center gap-1 hover:text-[#001229] ${align === 'right' ? 'justify-end w-full' : align === 'center' ? 'justify-center w-full' : ''}`}>
      {label}<ArrowUpDown className={`w-3 h-3 ${scheduleSortCol === key ? 'text-[#4059aa]' : 'text-slate-400'}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col md:flex-row font-sans text-[13px] antialiased">
      {/* 1. PERSISTENT LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-60 bg-[#eff4ff] border-r border-[#dce9ff] flex flex-col justify-between shrink-0 select-none z-30 shadow-xs">
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="h-14 px-4 flex items-center justify-between bg-[#e5eeff] border-b border-[#dce9ff]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-[#0f2744] flex items-center justify-center text-white shadow-xs">
                <span className="material-symbols-outlined text-[18px]">precision_manufacturing</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[15px] tracking-tight text-[#001229] leading-none">Chips MRP</span>
                <span className="text-[10px] text-[#44474d] font-semibold tracking-wider uppercase mt-0.5">
                  Production &amp; Inventory
                </span>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-[#4059aa]"></div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-[12.5px] font-semibold transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-[#001229] text-white shadow-xs'
                  : 'text-[#44474d] hover:bg-[#dce9ff] hover:text-[#001229]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-[12.5px] font-semibold transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-[#001229] text-white shadow-xs'
                  : 'text-[#44474d] hover:bg-[#dce9ff] hover:text-[#001229]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px]">query_stats</span>
                <span>Analytics Suite</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('materials')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-[12.5px] font-semibold transition-colors ${
                activeTab === 'materials'
                  ? 'bg-[#001229] text-white shadow-xs'
                  : 'text-[#44474d] hover:bg-[#dce9ff] hover:text-[#001229]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                <span>Raw Materials</span>
              </div>
              {lowStockAlerts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white font-mono text-[10px] font-bold">
                  {lowStockAlerts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-[12.5px] font-semibold transition-colors ${
                activeTab === 'products'
                  ? 'bg-[#001229] text-white shadow-xs'
                  : 'text-[#44474d] hover:bg-[#dce9ff] hover:text-[#001229]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px]">category</span>
                <span>Products Catalog</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('bom')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-[12.5px] font-semibold transition-colors ${
                activeTab === 'bom'
                  ? 'bg-[#001229] text-white shadow-xs'
                  : 'text-[#44474d] hover:bg-[#dce9ff] hover:text-[#001229]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span>Bill of Materials</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-[12.5px] font-semibold transition-colors ${
                activeTab === 'schedule'
                  ? 'bg-[#001229] text-white shadow-xs'
                  : 'text-[#44474d] hover:bg-[#dce9ff] hover:text-[#001229]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                <span>Production Schedule</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('feasibility')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-[12.5px] font-semibold transition-colors ${
                activeTab === 'feasibility'
                  ? 'bg-[#001229] text-white shadow-xs'
                  : 'text-[#44474d] hover:bg-[#dce9ff] hover:text-[#001229]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px]">calculate</span>
                <span>Material Feasibility</span>
              </div>
            </button>
          </nav>
        </div>

        {/* User / Plant Role Profile */}
        <div className="p-3 bg-[#eff4ff]">
          <div className="p-2.5 bg-[#e5eeff] rounded border border-[#dce9ff] flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#001229] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white text-[18px]">person</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[12px] font-bold text-[#0b1c30] truncate">MRP Controller</span>
                <span className="text-[11px] text-[#44474d] truncate">Inventory &amp; Planning</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#dce9ff]/60 text-[11px]">
              <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-[#44474d]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>DB Connected</span>
              </div>
              <span className="text-[10px] text-[#4059aa] font-bold uppercase tracking-wider">ACTIVE</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <header className="h-14 bg-white/90 backdrop-blur-md border-b border-[#e5eeff] px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[12.5px] text-[#44474d]">
              <span>Operations</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-bold text-[#0b1c30]">
                {activeTab === 'dashboard' && 'MRP Dispatch Console'}
                {activeTab === 'analytics' && 'Manufacturing Analytics Suite'}
                {activeTab === 'materials' && 'Raw Materials Inventory Ledger'}
                {activeTab === 'products' && 'Product Master Catalog'}
                {activeTab === 'bom' && 'Bill of Materials Recipes'}
                {activeTab === 'schedule' && 'Production Schedule & Reservations'}
                {activeTab === 'feasibility' && 'Material Feasibility Engine'}
              </span>
            </div>
            <div className="h-4 w-px bg-[#d3e4fe]"></div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#e5eeff] rounded text-[11px] font-mono font-bold text-[#001229]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4059aa] animate-pulse"></span>
              <span>LIVE MRP FEED</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-[12px] text-[#44474d] bg-[#e5eeff] px-2.5 py-1 rounded">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>{currentTime || 'LIVE CLOCK'}</span>
            </div>

            {/* Low-Stock Alerts Bell */}
            <div className="relative">
              <button
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                className="relative p-1 text-[#44474d] hover:text-[#0b1c30]"
                title="MRP Alerts & Notifications"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {lowStockAlerts.length > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                )}
                {lowStockAlerts.length > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-red-600"></span>
                )}
              </button>

              {isAlertsOpen && (
                <div className="absolute right-0 mt-2 w-88 bg-white rounded-lg shadow-xl border border-[#e5eeff] z-50 p-3.5 text-[12px] animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 border-b border-[#e5eeff]">
                    <div className="flex items-center gap-1.5 font-bold text-[#001229]">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>MRP Inventory &amp; Production Alerts</span>
                    </div>
                    <button
                      onClick={() => setIsAlertsOpen(false)}
                      className="text-[#74777e] hover:text-[#001229] text-[11px] font-semibold"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="mt-2.5 space-y-2 max-h-72 overflow-y-auto">
                    {lowStockAlerts.length > 0 ? (
                      lowStockAlerts.map((alert) => (
                        <div key={alert.material_id} className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-900 text-[11.5px]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{alert.material_name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-200 text-rose-800 font-mono text-[10px] font-bold">
                              {alert.urgency}
                            </span>
                          </div>
                          <p className="mt-1 leading-snug">
                            Available: <strong className="font-mono">{alert.available_qty.toFixed(1)} {alert.unit}</strong> (Physical: {alert.physical_stock.toFixed(1)}, Reserved: {alert.reserved_qty.toFixed(1)}). Below threshold of {alert.min_stock_threshold.toFixed(1)} {alert.unit}.
                          </p>
                          <div className="mt-1 font-mono text-[10.5px] text-rose-700 font-semibold">
                            Deficit: {alert.deficit.toFixed(1)} {alert.unit}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11.5px] flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>All raw material inventories are above safety thresholds. Zero stockout alarms.</span>
                      </div>
                    )}

                    {dashboardData && dashboardData.total_shortfall > 0 && (
                      <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11.5px]">
                        <span className="font-bold block">Production Target Variance</span>
                        <span>
                          Cumulative unfulfilled volume: {dashboardData.total_shortfall.toLocaleString()} pkts in active window.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                refreshAllMasterData();
                showToast('Refreshed all production & material feeds', 'success');
              }}
              className="p-1 text-[#44474d] hover:text-[#0b1c30]"
              title="Refresh Feeds"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
          </div>
        </header>

        {/* System Flash Notification Banners */}
        {toast && (
          <div className="px-6 pt-3">
            <div
              className={`p-3 rounded flex items-center justify-between text-[13px] ${
                toast.type === 'error'
                  ? 'bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/30'
                  : 'bg-[#dce9ff] text-[#001229] border border-[#4059aa]/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  {toast.type === 'error' ? 'warning' : 'check_circle'}
                </span>
                <div>
                  {toast.title && <strong className="block text-[11px] uppercase tracking-wider">{toast.title}</strong>}
                  <span>{toast.message}</span>
                </div>
              </div>
              <button onClick={() => setToast(null)} className="hover:opacity-75">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="p-6 flex-1 flex flex-col max-w-[1440px] w-full mx-auto">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-4">
              {/* Header Title & Controls Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-[#001229] tracking-tight">MRP Dispatch Console</h1>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#dce9ff] text-[#4059aa] text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4059aa] animate-pulse"></span>
                      Chips Manufacturing Control Center
                    </span>
                  </div>
                  <p className="text-[12px] text-[#44474d] mt-0.5">
                    Manufacturing overview, stock reservation monitoring, and raw material demand fulfillment
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Date Filter */}
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-[#e5eeff] shadow-2xs font-mono text-[11px]">
                    <span className="material-symbols-outlined text-[15px] text-[#44474d]">date_range</span>
                    <span className="text-[#44474d] text-[10px]">Filter:</span>
                    <input
                      type="date"
                      value={dashboardStartDate}
                      onChange={(e) => handleDashboardDateFilter(e.target.value, dashboardEndDate)}
                      title="Start Date"
                      className="text-[11px] font-mono outline-hidden bg-transparent"
                    />
                    <span className="text-[#74777e]">-</span>
                    <input
                      type="date"
                      value={dashboardEndDate}
                      onChange={(e) => handleDashboardDateFilter(dashboardStartDate, e.target.value)}
                      title="End Date"
                      className="text-[11px] font-mono outline-hidden bg-transparent"
                    />
                    {(dashboardStartDate || dashboardEndDate) && (
                      <button
                        onClick={() => handleDashboardDateFilter('', '')}
                        title="Reset Date Filter"
                        className="text-red-600 hover:text-red-800 font-bold ml-1 px-1 bg-red-50 rounded text-[10px]"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <button
                    onClick={exportShiftReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001229] text-white rounded text-[12px] font-semibold hover:bg-[#4059aa] shadow-2xs transition-colors"
                    title="Download Production Summary as CSV"
                  >
                    <span className="material-symbols-outlined text-[15px]">file_download</span>
                    <span>Export MRP Report</span>
                  </button>
                </div>
              </div>

              {/* Five Compact KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* 1: Active Products */}
                <div className="bg-white rounded border border-[#e5eeff] shadow-2xs p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#44474d]">
                    <span className="text-[11px] font-bold uppercase tracking-wider">FINISHED PRODUCTS</span>
                    <span className="material-symbols-outlined text-[16px]">category</span>
                  </div>
                  <div className="my-1.5 flex items-baseline justify-between">
                    <span className="font-mono text-xl font-bold text-[#001229]">{products.length} Varieties</span>
                    <span className="font-mono text-[11px] text-[#4059aa] font-medium">BOM Configured</span>
                  </div>
                  <div className="text-[11px] text-[#44474d] truncate">
                    {products.map((p) => `${p.name} (${p.packet_size}g)`).slice(0, 2).join(' • ')}...
                  </div>
                </div>

                {/* 2: Raw Materials */}
                <div className="bg-white rounded border border-[#e5eeff] shadow-2xs p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#44474d]">
                    <span className="text-[11px] font-bold uppercase tracking-wider">RAW INVENTORY</span>
                    <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                  </div>
                  <div className="my-1.5 flex items-baseline justify-between">
                    <span className="font-mono text-xl font-bold text-[#001229]">{materials.length} Materials</span>
                    <span className={`font-mono text-[11px] font-bold ${lowStockAlerts.length > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                      {lowStockAlerts.length > 0 ? `${lowStockAlerts.length} Low Stock` : 'Healthy'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#44474d] truncate">
                    Valuation: ₹{(dashboardData?.total_inventory_val || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>

                {/* 3: Planned Production */}
                <div className="bg-white rounded border border-[#e5eeff] shadow-2xs p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#44474d]">
                    <span className="text-[11px] font-bold uppercase tracking-wider">PLANNED TARGET</span>
                    <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  </div>
                  <div className="my-1.5 flex items-baseline justify-between">
                    <span className="font-mono text-xl font-bold text-[#001229]">
                      {dashboardData ? dashboardData.total_planned.toLocaleString() : '0'} pkts
                    </span>
                    <span className="font-mono text-[11px] text-[#44474d] font-semibold">Scheduled Target</span>
                  </div>
                  <div className="text-[11px] text-[#44474d] truncate">Target across active runs</div>
                </div>

                {/* 4: Actual Output */}
                <div className="bg-white rounded border border-[#e5eeff] shadow-2xs p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#44474d]">
                    <span className="text-[11px] font-bold uppercase tracking-wider">ACTUAL PACKOUT</span>
                    <span className="material-symbols-outlined text-[16px]">fact_check</span>
                  </div>
                  <div className="my-1.5 flex items-baseline justify-between">
                    <span className="font-mono text-xl font-bold text-[#4059aa]">
                      {dashboardData ? dashboardData.total_actual.toLocaleString() : '0'} pkts
                    </span>
                    <span className="font-mono text-[11px] text-[#4059aa] font-medium">
                      {dashboardData ? dashboardData.overall_achievement.toFixed(1) : '0.0'}% Yield
                    </span>
                  </div>
                  <div className="text-[11px] text-[#44474d] truncate">Dispatched finished goods output</div>
                </div>

                {/* 5: Achievement & Variance */}
                <div className="bg-white rounded border border-[#e5eeff] shadow-2xs p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#44474d]">
                    <span className="text-[11px] font-bold uppercase tracking-wider">NET VARIANCE</span>
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-[#dce9ff] text-[#4059aa]">
                      {dashboardData && (dashboardData.total_actual - dashboardData.total_planned) >= 0 ? 'SURPLUS' : 'SHORTFALL'}
                    </span>
                  </div>
                  <div className="my-1.5 flex items-baseline justify-between">
                    <span className={`font-mono text-xl font-bold ${
                      dashboardData && (dashboardData.total_actual - dashboardData.total_planned) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {dashboardData ? (
                        (dashboardData.total_actual - dashboardData.total_planned) >= 0
                          ? `+${(dashboardData.total_actual - dashboardData.total_planned).toLocaleString()}`
                          : (dashboardData.total_actual - dashboardData.total_planned).toLocaleString()
                      ) : '0'} pkts
                    </span>
                    <span className="font-mono text-[11px] text-[#44474d] font-semibold">
                      Actual − Planned
                    </span>
                  </div>
                  <div className="w-full bg-[#e5eeff] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#4059aa] h-full rounded-full transition-all duration-500"
                      style={{ width: `${dashboardData ? Math.min(100, Math.max(0, dashboardData.overall_achievement)) : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Two-Column Grid */}
              <div className="grid grid-cols-12 gap-3.5 items-start">
                {/* LEFT COLUMN: Production Tracking */}
                <div className="col-span-12 xl:col-span-7 flex flex-col gap-3.5">
                  {/* Panel A: Planned vs Actual Production Curve */}
                  <div className="bg-white rounded border border-[#e5eeff] shadow-2xs p-3.5 flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                      <div>
                        <h2 className="font-bold text-[14px] text-[#001229]">Planned vs Actual Production</h2>
                        <p className="text-[11px] text-[#44474d]">
                          Daily finished packet output tracking vs ERP scheduled targets
                        </p>
                      </div>
                    </div>

                    {/* Filter Pills Bar */}
                    <div className="flex items-center justify-between py-1 my-1 flex-wrap gap-2">
                      <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 text-[11px]">
                        <button
                          onClick={() => handleProductFilterChange(undefined)}
                          className={`px-2.5 py-0.5 rounded-full font-semibold transition-colors shrink-0 ${
                            !selectedProductFilter ? 'bg-[#001229] text-white' : 'bg-[#e5eeff] text-[#0b1c30]'
                          }`}
                        >
                          All Products ({products.length})
                        </button>
                        {products.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleProductFilterChange(p.id)}
                            className={`px-2.5 py-0.5 rounded-full transition-colors shrink-0 ${
                              selectedProductFilter === p.id
                                ? 'bg-[#001229] text-white font-semibold'
                                : 'bg-[#e5eeff] text-[#0b1c30] hover:bg-[#dce9ff]'
                            }`}
                          >
                            {p.name} {p.packet_size}g
                          </button>
                        ))}
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-3 text-[11px]">
                        <div className="flex items-center gap-1 text-[#44474d]">
                          <span className="w-2 h-2 rounded-full bg-[#74777e]"></span>
                          <span>Planned Target</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#0b1c30] font-bold">
                          <span className="w-2 h-2 rounded-full bg-[#4059aa]"></span>
                          <span>Actual Output</span>
                        </div>
                      </div>
                    </div>

                    {/* SVG Curve Chart */}
                    <div className="relative w-full h-[220px] bg-[#eff4ff] rounded p-2 overflow-hidden flex flex-col justify-between">
                      <svg viewBox="0 0 540 180" className="w-full h-full" preserveAspectRatio="none">
                        <g className="text-[10px] font-mono fill-[#74777e]">
                          <line x1="30" y1="20" x2="520" y2="20" stroke="#dce9ff" strokeWidth="1" strokeDasharray="3 3" />
                          <text x="10" y="24">{(maxOutputVal * 0.95 / 1000).toFixed(0)}k</text>

                          <line x1="30" y1="55" x2="520" y2="55" stroke="#dce9ff" strokeWidth="1" strokeDasharray="3 3" />
                          <text x="10" y="59">{(maxOutputVal * 0.70 / 1000).toFixed(0)}k</text>

                          <line x1="30" y1="90" x2="520" y2="90" stroke="#dce9ff" strokeWidth="1" strokeDasharray="3 3" />
                          <text x="10" y="94">{(maxOutputVal * 0.45 / 1000).toFixed(0)}k</text>

                          <line x1="30" y1="125" x2="520" y2="125" stroke="#dce9ff" strokeWidth="1" strokeDasharray="3 3" />
                          <text x="10" y="129">{(maxOutputVal * 0.20 / 1000).toFixed(0)}k</text>

                          <line x1="30" y1="155" x2="520" y2="155" stroke="#dce9ff" strokeWidth="1" />
                          <text x="10" y="159">0</text>
                        </g>

                        <defs>
                          <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4059aa" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#4059aa" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {actualAreaD && <path d={actualAreaD} fill="url(#actualGradient)" />}

                        {plannedLineD && (
                          <path
                            d={plannedLineD}
                            fill="none"
                            stroke="#74777e"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                          />
                        )}

                        {actualLineD && (
                          <path
                            d={actualLineD}
                            fill="none"
                            stroke="#4059aa"
                            strokeWidth="2.5"
                          />
                        )}

                        {chartPoints.map((pt, i) => (
                          <g key={i} className="cursor-pointer">
                            <title>{`${pt.label} (${pt.date}): Target ${pt.planned_qty.toLocaleString()} pkts, Actual ${pt.actual_qty.toLocaleString()} pkts`}</title>
                            <circle cx={pt.x} cy={pt.yPlanned} r="3" fill="#74777e" />
                            <circle cx={pt.x} cy={pt.yActual} r="4.5" fill="#ffffff" stroke="#4059aa" strokeWidth="2.5" />
                          </g>
                        ))}
                      </svg>

                      {/* X-Axis Dates */}
                      <div className="flex items-center justify-between text-[10.5px] font-mono text-[#44474d] px-8">
                        {chartPoints.map((pt, i) => (
                          <span key={i} className={i === chartPoints.length - 1 ? 'font-bold text-[#0b1c30]' : ''}>
                            {pt.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Panel B: Production Variance Analysis (Shortfall & Surplus) */}
                  <div className="bg-white rounded border border-[#e5eeff] shadow-2xs p-3.5 flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-bold text-[14px] text-[#001229]">Production Target Variance</h2>
                          <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 font-mono text-[11px] font-bold">
                            Shortfall: {dashboardData ? dashboardData.total_shortfall.toLocaleString() : '0'} pkts
                          </span>
                        </div>
                        <p className="text-[11px] text-[#44474d] mt-0.5">
                          Variance = Actual Output − Planned Target. Negative denotes Shortfall; Positive denotes Surplus.
                        </p>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1 text-[#0b1c30] font-bold">
                          <span className="w-2.5 h-2.5 rounded-2xs bg-[#4059aa]"></span>
                          <span>Achieved Output</span>
                        </span>
                        <span className="flex items-center gap-1 text-[#ba1a1a] font-bold">
                          <span className="w-2.5 h-2.5 rounded-2xs bg-[#ba1a1a]"></span>
                          <span>Target Shortfall</span>
                        </span>
                      </div>
                    </div>

                    {/* Stacked Bars */}
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2 pt-1">
                      {shortfallBars.map((bar, i) => {
                        const maxVal = Math.max(...shortfallBars.map((b) => Math.max(b.planned, b.actual)), 1000);
                        const actualPct = Math.min(100, Math.max(10, (bar.actual / maxVal) * 100));
                        const shortfallPct = Math.min(100, Math.max(0, (bar.shortfall / maxVal) * 100));
                        return (
                          <div
                            key={i}
                            className="bg-[#eff4ff] p-2 rounded flex flex-col justify-end h-40 border border-[#dce9ff]"
                            title={`Date: ${bar.fullDate} | Planned: ${bar.planned.toLocaleString()} pkts | Actual: ${bar.actual.toLocaleString()} pkts | Shortfall: ${bar.shortfall.toLocaleString()} pkts`}
                          >
                            <div className="w-full flex-1 flex flex-col justify-end gap-0.5">
                              {bar.shortfall > 0 && (
                                <div
                                  className="w-full bg-[#ba1a1a] rounded-t text-center py-0.5"
                                  style={{ height: `${shortfallPct}%`, minHeight: '18px' }}
                                >
                                  <span className="font-mono text-[10px] text-white block leading-none font-bold">
                                    -{bar.shortfall.toLocaleString()}
                                  </span>
                                </div>
                              )}
                              <div
                                className="w-full bg-[#4059aa] rounded-b text-center py-1 flex items-center justify-center"
                                style={{ height: `${actualPct}%`, minHeight: '36px' }}
                              >
                                <span className="font-mono text-[11px] text-white font-bold">
                                  {(bar.actual / 1000).toFixed(1)}k
                                </span>
                              </div>
                            </div>
                            <div className="pt-2 text-center">
                              <span className="font-mono text-[11px] font-bold text-[#0b1c30] block truncate">
                                {bar.date}
                              </span>
                              <span className="text-[11px] font-bold text-[#4059aa] block">
                                {bar.ach}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Raw Material Requirement vs Stock Holding */}
                <div className="col-span-12 xl:col-span-5 flex flex-col gap-3.5">
                  <div className="bg-white rounded border border-[#e5eeff] shadow-2xs p-3.5 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#e5eeff]">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-[#001229]">inventory_2</span>
                        <h2 className="font-bold text-[14px] text-[#001229]">Raw Material Requirement</h2>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-[#4059aa] font-bold font-mono">
                        BOM DEMAND
                      </span>
                    </div>

                    {/* Material Switcher Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-2 text-[11px]">
                      {materials.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleMaterialFilterChange(m.id)}
                          className={`px-2.5 py-1 rounded text-center shrink-0 font-medium transition-colors ${
                            (selectedMaterialFilter === m.id || (!selectedMaterialFilter && currentMaterial?.id === m.id))
                              ? 'bg-[#001229] text-white font-bold'
                              : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff]'
                          }`}
                        >
                          {m.material_name} ({m.unit})
                        </button>
                      ))}
                    </div>

                    {/* Stock Detail Card */}
                    <div className="mt-2 p-2.5 bg-[#eff4ff] rounded flex flex-col gap-1 border border-[#dce9ff]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[13px] text-[#001229] truncate">
                          {matName}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#e5eeff] text-[#0b1c30] font-semibold">
                          ID #{currentMaterial?.id || 1}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[10.5px] text-[#44474d]">
                        <span>Unit Cost: ₹{(currentMaterial?.cost_per_unit || 0).toFixed(2)} / {matUnit}</span>
                        <span>Safety Threshold: {(currentMaterial?.min_stock_threshold || 0).toFixed(1)} {matUnit}</span>
                      </div>

                      {/* Stock vs Requirement Card */}
                      <div className="mt-1 bg-white p-2.5 rounded shadow-2xs border border-[#e5eeff]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#44474d] uppercase font-bold text-[10px] tracking-wider">
                            PHYSICAL HOLDING VS BOM DEMAND
                          </span>
                          <span className="font-mono font-bold text-[#001229]">
                            {matStock.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {matUnit} on Hand
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-2 relative">
                          <div className="h-3.5 w-full bg-[#e5eeff] rounded-full overflow-hidden flex">
                            <div
                              className={`${bufferVal >= 0 ? 'bg-[#4059aa]' : 'bg-[#ba1a1a]'} h-full transition-all duration-300`}
                              style={{ width: `${scheduledCapPct}%` }}
                            ></div>
                            <div className="bg-[#dce9ff] h-full flex-1"></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 font-mono text-[10.5px]">
                          <span className="text-[#44474d]">
                            Scheduled: <b className="text-[#0b1c30]">{scheduledReq.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {matUnit}</b>
                          </span>
                          <span className={`font-bold ${bufferVal >= 0 ? 'text-[#4059aa]' : 'text-[#ba1a1a]'}`}>
                            Buffer: {bufferVal >= 0 ? `+${bufferVal.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${matUnit}` : `-${Math.abs(bufferVal).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${matUnit} Deficit`}
                          </span>
                        </div>
                      </div>

                      {/* Burn Rate & Sufficiency */}
                      <div className="grid grid-cols-2 gap-1.5 mt-1">
                        <div className="bg-white p-2 rounded border border-[#e5eeff]">
                          <span className="text-[10px] text-[#44474d] block uppercase font-bold tracking-wider">
                            AVG SCHEDULED DEMAND
                          </span>
                          <span className="font-mono text-sm font-bold text-[#001229]">
                            {dailyDemands.length > 0 ? (scheduledReq / dailyDemands.length).toFixed(1) : '0.0'} {matUnit}/day
                          </span>
                        </div>
                        <div className="bg-white p-2 rounded border border-[#e5eeff]">
                          <span className="text-[10px] text-[#44474d] block uppercase font-bold tracking-wider">
                            SUFFICIENCY STATUS
                          </span>
                          <span className={`font-mono text-sm font-bold ${bufferVal >= 0 ? 'text-emerald-700' : 'text-[#ba1a1a]'}`}>
                            {bufferVal >= 0 ? 'Sufficient' : 'Procurement Needed'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Daily Scheduled Demand */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1.5 text-[11px]">
                        <span className="font-bold text-[#001229]">Daily Scheduled Demand ({matUnit})</span>
                        <span className="font-mono text-[#44474d]">
                          Total: {scheduledReq.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {matUnit}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {dailyDemands.length === 0 ? (
                          <div className="text-[11px] text-[#74777e] italic py-2 text-center bg-[#eff4ff] rounded">
                            No scheduled BOM requirements in active dates
                          </div>
                        ) : (
                          dailyDemands.map((d, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px]">
                              <span className="font-mono w-14 text-[#44474d]">{d.date}</span>
                              <div className="flex-1 bg-[#eff4ff] rounded-full h-2.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${i === dailyDemands.length - 1 ? 'bg-[#4059aa]' : 'bg-[#74777e]'}`}
                                  style={{ width: `${Math.min(100, Math.max(5, d.pct))}%` }}
                                ></div>
                              </div>
                              <span className="font-mono w-20 text-right font-medium text-[#0b1c30]">
                                {d.req.toLocaleString()} {matUnit}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Bar: Live Real MRP Status */}
              <div className="bg-white rounded border border-[#e5eeff] shadow-2xs p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-5 text-[11.5px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <div>
                      <span className="font-bold text-[#001229] block">Inventory Valuation</span>
                      <span className="font-mono text-[#44474d] text-[11px]">
                        ₹{(dashboardData?.total_inventory_val || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="h-5 w-px bg-[#d3e4fe]"></div>

                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                    <div>
                      <span className="font-bold text-[#001229] block">Active Reservations</span>
                      <span className="font-mono text-[#44474d] text-[11px]">
                        {dashboardData?.active_reservations_count || 0} active reservation lock(s)
                      </span>
                    </div>
                  </div>

                  <div className="h-5 w-px bg-[#d3e4fe]"></div>

                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${lowStockAlerts.length > 0 ? 'bg-red-600' : 'bg-emerald-600'}`}></span>
                    <div>
                      <span className="font-bold text-[#001229] block">Low Stock Warnings</span>
                      <span className="font-mono text-[#44474d] text-[11px]">
                        {lowStockAlerts.length} item(s) below safety threshold
                      </span>
                    </div>
                  </div>

                  <div className="h-5 w-px bg-[#d3e4fe]"></div>

                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4059aa]"></span>
                    <div>
                      <span className="font-bold text-[#001229] block">Scheduled Production</span>
                      <span className="font-mono text-[#44474d] text-[11px]">
                        {schedules.filter((s) => s.status === 'SCHEDULED' || s.status === 'AT_RISK').length} pending ({schedules.filter((s) => s.status === 'AT_RISK').length} at risk), {schedules.filter((s) => s.status === 'COMPLETED' || (!s.status && s.actual_qty > 0)).length} completed
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      fetchReorderSuggestions();
                      setIsReorderModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff] text-[12px] font-semibold"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Reorder Suggestions</span>
                  </button>
                  <button
                    onClick={() => {
                      setAdjustingMaterial(null);
                      setIsAdjustStockModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#001229] text-white hover:bg-[#4059aa] text-[12px] font-semibold shadow-xs transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Adjust Stock</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANALYTICS SUITE */}
          {activeTab === 'analytics' && (
            <Analytics products={products} materials={materials} onShowToast={showToast} />
          )}

          {/* TAB 3: RAW MATERIALS INVENTORY LEDGER */}
          {activeTab === 'materials' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-[#001229] tracking-tight">Raw Materials Inventory Ledger</h1>
                  <p className="text-[12px] text-[#44474d]">Physical balances, stock reservations, safety thresholds &amp; manual adjustments</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      fetchMovements();
                      setIsMovementsModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#cbd5e1] hover:bg-slate-50 text-[#0b1c30] text-[12px] font-semibold rounded shadow-2xs"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Movement History</span>
                  </button>
                  <button
                    onClick={() => {
                      fetchReorderSuggestions();
                      setIsReorderModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eff4ff] border border-[#dce9ff] hover:bg-[#dce9ff] text-[#0b1c30] text-[12px] font-semibold rounded shadow-2xs"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Reorder Suggestions</span>
                  </button>
                  <button
                    onClick={() => {
                      setAdjustingMaterial(null);
                      setIsAdjustStockModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#cbd5e1] hover:bg-slate-50 text-[#0b1c30] text-[12px] font-semibold rounded shadow-2xs"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Adjust Stock</span>
                  </button>
                  <button
                    onClick={() => setIsAddMaterialModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001229] hover:bg-[#4059aa] text-white text-[12px] font-semibold rounded shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register Raw Material</span>
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded border border-[#e5eeff] shadow-2xs">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#44474d]">TOTAL RAW INGREDIENTS</span>
                  <div className="my-1 font-mono text-xl font-bold text-[#001229]">{materials.length}</div>
                  <span className="text-[11px] text-[#44474d]">Managed recipe components</span>
                </div>
                <div className="bg-white p-3 rounded border border-[#e5eeff] shadow-2xs">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#44474d]">TOTAL INVENTORY VALUATION</span>
                  <div className="my-1 font-mono text-xl font-bold text-[#001229]">
                    ₹{materials.reduce((acc, m) => acc + m.stock_qty * m.cost_per_unit, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[11px] text-[#44474d]">At unit procurement cost</span>
                </div>
                <div className="bg-white p-3 rounded border border-[#e5eeff] shadow-2xs">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#44474d]">LOW STOCK WARNINGS</span>
                  <div className={`my-1 font-mono text-xl font-bold ${lowStockAlerts.length > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {lowStockAlerts.length}
                  </div>
                  <span className="text-[11px] text-[#44474d]">Available stock &lt; minimum threshold</span>
                </div>
                <div className="bg-white p-3 rounded border border-[#e5eeff] shadow-2xs">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#44474d]">ACTIVE RESERVATIONS</span>
                  <div className="my-1 font-mono text-xl font-bold text-amber-700">
                    {materials.reduce((acc, m) => acc + (m.reserved_qty || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </div>
                  <span className="text-[11px] text-[#44474d]">Cumulative reserved units</span>
                </div>
              </div>

              {/* Table Card */}
              <div className="bg-white rounded border border-[#e5eeff] shadow-2xs overflow-hidden">
                <div className="p-3.5 border-b border-[#e5eeff] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search material description..."
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                      className="border border-slate-300 rounded px-2.5 py-1 text-xs outline-hidden w-64"
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    Formula: Available Stock = Physical Stock − Reserved Stock
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[12.5px]">
                    <thead>
                      <tr className="bg-[#f8fafc] text-[#44474d] text-[10px] font-bold uppercase tracking-wider border-b border-[#e5eeff]">
                        <th
                          className="py-2.5 px-3 cursor-pointer hover:bg-slate-100"
                          onClick={() => {
                            if (materialSortCol === 'id') setMaterialSortAsc(!materialSortAsc);
                            else { setMaterialSortCol('id'); setMaterialSortAsc(true); }
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <span>ID</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>
                        <th
                          className="py-2.5 px-3 cursor-pointer hover:bg-slate-100"
                          onClick={() => {
                            if (materialSortCol === 'name') setMaterialSortAsc(!materialSortAsc);
                            else { setMaterialSortCol('name'); setMaterialSortAsc(true); }
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <span>MATERIAL NAME</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>
                        <th className="py-2.5 px-3">UNIT</th>
                        <th
                          className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100"
                          onClick={() => {
                            if (materialSortCol === 'stock') setMaterialSortAsc(!materialSortAsc);
                            else { setMaterialSortCol('stock'); setMaterialSortAsc(true); }
                          }}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>PHYSICAL STOCK</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>
                        <th className="py-2.5 px-3 text-right text-amber-700 font-bold">RESERVED</th>
                        <th
                          className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 text-blue-900 font-bold"
                          onClick={() => {
                            if (materialSortCol === 'avail') setMaterialSortAsc(!materialSortAsc);
                            else { setMaterialSortCol('avail'); setMaterialSortAsc(true); }
                          }}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>AVAILABLE STOCK</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>
                        <th className="py-2.5 px-3 text-right">MIN THRESHOLD</th>
                        <th className="py-2.5 px-3 text-right">COST/UNIT</th>
                        <th className="py-2.5 px-3 text-right">VALUATION</th>
                        <th className="py-2.5 px-3 text-center">STOCK STATUS</th>
                        <th className="py-2.5 px-3 text-center w-36">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {filteredMaterials.map((mat) => {
                        const phys = mat.stock_qty;
                        const res = mat.reserved_qty || 0;
                        const avail = mat.available_qty !== undefined ? mat.available_qty : (phys - res);
                        const thresh = mat.min_stock_threshold || 0;
                        const isLow = avail < thresh;
                        const isZero = avail <= 0;

                        return (
                          <tr key={mat.id} className="hover:bg-[#f8f9ff]">
                            <td className="py-2 px-3 font-mono text-[#74777e]">#{mat.id}</td>
                            <td className="py-2 px-3 font-bold text-[#001229]">{mat.material_name}</td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.5 rounded bg-[#eff4ff] text-[#44474d] font-mono text-[11px]">
                                {mat.unit}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#001229]">
                              {phys.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-amber-700 font-bold">
                              {res.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-blue-700">
                              {avail.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                              {thresh.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-[#44474d]">
                              ₹{mat.cost_per_unit.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-[#001229]">
                              ₹{(phys * mat.cost_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {isZero ? (
                                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                                  STOCKOUT
                                </span>
                              ) : isLow ? (
                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                                  LOW STOCK ALERT
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                                  OPTIMAL
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setAdjustingMaterial(mat);
                                    setIsAdjustStockModalOpen(true);
                                  }}
                                  className="px-2 py-0.5 rounded bg-[#eff4ff] hover:bg-[#dce9ff] text-[11px] font-semibold text-[#0b1c30]"
                                  title="Adjust Stock Quantity"
                                >
                                  Adjust
                                </button>
                                <button
                                  onClick={() => setEditingMaterial(mat)}
                                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeletingMaterial(mat)}
                                  className="px-2 py-0.5 text-red-600 hover:underline text-[11px] font-semibold"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRODUCTS CATALOG */}
          {activeTab === 'products' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-[#001229] tracking-tight">Finished Goods Master Catalog</h1>
                  <p className="text-[12px] text-[#44474d]">Finished potato chip products (SKUs), pack sizes, retail MRP &amp; stock balances</p>
                </div>
                <button
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001229] hover:bg-[#4059aa] text-white text-[12px] font-semibold rounded shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Product</span>
                </button>
              </div>

              {/* Products Table Card */}
              <div className="bg-white rounded border border-[#e5eeff] shadow-2xs overflow-hidden">
                <div className="p-3.5 border-b border-[#e5eeff] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search product variety..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="border border-slate-300 rounded px-2.5 py-1 text-xs outline-hidden w-64"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {products.length} registered finished varieties
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[12.5px]">
                    <thead>
                      <tr className="bg-[#f8fafc] text-[#44474d] text-[10px] font-bold uppercase tracking-wider border-b border-[#e5eeff]">
                        <th className="py-2.5 px-3 w-16">{productSortHeader('ID', 'id')}</th>
                        <th className="py-2.5 px-3">{productSortHeader('PRODUCT / VARIETY NAME', 'name')}</th>
                        <th className="py-2.5 px-3">{productSortHeader('PACKET SIZE', 'size')}</th>
                        <th className="py-2.5 px-3 text-right">{productSortHeader('FINISHED STOCK (PKTS)', 'stock', 'right')}</th>
                        <th className="py-2.5 px-3 text-right">{productSortHeader('RETAIL MRP', 'mrp', 'right')}</th>
                        <th className="py-2.5 px-3 text-center w-28">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {filteredProducts.map((prod) => (
                          <tr key={prod.id} className="hover:bg-[#f8f9ff]">
                            <td className="py-2 px-3 font-mono text-[#74777e]">#{prod.id}</td>
                            <td className="py-2 px-3 font-bold text-[#001229]">{prod.name}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{prod.packet_size}g</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#001229]">
                              {prod.stock_qty.toLocaleString()} pkts
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-[#44474d]">
                              ₹{prod.mrp.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setEditingProduct(prod)}
                                  className="px-2 py-0.5 rounded bg-[#eff4ff] hover:bg-[#dce9ff] text-[11px] font-semibold text-[#0b1c30]"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeletingProduct(prod)}
                                  className="px-2 py-0.5 text-red-600 hover:underline text-[11px] font-semibold"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BILL OF MATERIALS (BOM) */}
          {activeTab === 'bom' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-[#001229] tracking-tight">Bill of Materials (BOM) Master</h1>
                  <p className="text-[12px] text-[#44474d]">Standard raw material formulation per finished product packet (Material Requirement = Quantity × BOM Per Unit)</p>
                </div>
                <button
                  onClick={() => setIsAddBOMModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001229] hover:bg-[#4059aa] text-white text-[12px] font-semibold rounded shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Recipe Line</span>
                </button>
              </div>

              {/* BOM Table */}
              <div className="bg-white rounded border border-[#e5eeff] shadow-2xs overflow-hidden">
                <div className="p-3.5 border-b border-[#e5eeff] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search BOM by product or material..."
                      value={bomSearch}
                      onChange={(e) => setBomSearch(e.target.value)}
                      className="border border-slate-300 rounded px-2.5 py-1 text-xs outline-hidden w-64"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    Zero wastage rule: Exact formulation consumption applied
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[12.5px]">
                    <thead>
                      <tr className="bg-[#f8fafc] text-[#44474d] text-[10px] font-bold uppercase tracking-wider border-b border-[#e5eeff]">
                        <th className="py-2.5 px-3 w-16">{bomSortHeader('RECIPE ID', 'id')}</th>
                        <th className="py-2.5 px-3">{bomSortHeader('FINISHED PRODUCT', 'product')}</th>
                        <th className="py-2.5 px-3">{bomSortHeader('RAW MATERIAL INGREDIENT', 'material')}</th>
                        <th className="py-2.5 px-3 text-right">{bomSortHeader('QTY REQUIRED / PACKET', 'qty', 'right')}</th>
                        <th className="py-2.5 px-3 text-right">RAW MATERIAL COST/UNIT</th>
                        <th className="py-2.5 px-3 text-right">{bomSortHeader('BOM INGREDIENT COST / PACKET', 'cost', 'right')}</th>
                        <th className="py-2.5 px-3 text-center w-28">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {filteredBOM.map((entry) => (
                          <tr key={entry.id} className="hover:bg-[#f8f9ff]">
                            <td className="py-2 px-3 font-mono text-[#74777e]">#{entry.id}</td>
                            <td className="py-2 px-3 font-bold text-[#001229]">
                              {entry.product_name} - {entry.packet_size}g
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-900">
                              {entry.material_name}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#4059aa]">
                              {entry.qty_required} {entry.unit}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-[#44474d]">
                              ₹{entry.cost_per_unit.toFixed(2)} / {entry.unit}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              ₹{entry.cost.toFixed(4)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setEditingBOM(entry)}
                                  className="px-2 py-0.5 rounded bg-[#eff4ff] hover:bg-[#dce9ff] text-[11px] font-semibold text-[#0b1c30]"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeletingBOM(entry)}
                                  className="px-2 py-0.5 text-red-600 hover:underline text-[11px] font-semibold"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PRODUCTION SCHEDULE & RESERVATIONS */}
          {activeTab === 'schedule' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-[#001229] tracking-tight">Production Schedule &amp; Reservations</h1>
                  <p className="text-[12px] text-[#44474d]">
                    Plans can be created before materials arrive. Reservations are made only when all required stock is available; completion records actual consumption and finished output.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddScheduleModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001229] hover:bg-[#4059aa] text-white text-[12px] font-semibold rounded shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule Production Run</span>
                </button>
              </div>

              {/* Status Filter Pills */}
              <div className="bg-white p-3 rounded border border-[#e5eeff] shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-700 mr-1">Status:</span>
                  {(['ALL', 'SCHEDULED', 'AT_RISK', 'COMPLETED', 'CANCELLED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setScheduleStatusFilter(st)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                        scheduleStatusFilter === st
                          ? 'bg-[#001229] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {st === 'ALL' ? `All Runs (${schedules.length})` : `${st.replace('_', ' ')} (${schedules.filter((s) => (s.status || (s.actual_qty > 0 ? 'COMPLETED' : 'AT_RISK')).toUpperCase() === st).length})`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by product or date..."
                    value={scheduleSearch}
                    onChange={(e) => setScheduleSearch(e.target.value)}
                    className="border border-slate-300 rounded px-2.5 py-1 text-xs outline-hidden w-56 font-mono"
                  />
                </div>
              </div>

              {/* Schedules Table */}
              <div className="bg-white rounded border border-[#e5eeff] shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[12.5px]">
                    <thead>
                      <tr className="bg-[#f8fafc] text-[#44474d] text-[10px] font-bold uppercase tracking-wider border-b border-[#e5eeff]">
                        <th className="py-2.5 px-3 w-16">{scheduleSortHeader('ID', 'id')}</th>
                        <th className="py-2.5 px-3">{scheduleSortHeader('DATE', 'date')}</th>
                        <th className="py-2.5 px-3">{scheduleSortHeader('FINISHED PRODUCT', 'product')}</th>
                        <th className="py-2.5 px-3 text-right">{scheduleSortHeader('PLANNED TARGET', 'planned', 'right')}</th>
                        <th className="py-2.5 px-3 text-right">{scheduleSortHeader('ACTUAL OUTPUT', 'actual', 'right')}</th>
                        <th className="py-2.5 px-3 text-right">{scheduleSortHeader('VARIANCE', 'variance', 'right')}</th>
                        <th className="py-2.5 px-3 text-center">{scheduleSortHeader('RUN STATUS', 'status', 'center')}</th>
                        <th className="py-2.5 px-3 text-right">{scheduleSortHeader('EST. / ACTUAL COST', 'total_cost', 'right')}</th>
                        <th className="py-2.5 px-3 text-right">{scheduleSortHeader('UNIT COST / PACKET', 'unit_cost', 'right')}</th>
                        <th className="py-2.5 px-3 text-center w-48">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {filteredSchedules.map((row) => {
                        const status = (row.status || (row.actual_qty > 0 ? 'COMPLETED' : 'AT_RISK')).toUpperCase();
                        const isScheduled = status === 'SCHEDULED';
                        const isAtRisk = status === 'AT_RISK';
                        const isCompleted = status === 'COMPLETED';
                        const isCancelled = status === 'CANCELLED';
                        const variance = row.actual_qty - row.planned_qty;

                        return (
                          <tr key={row.id} className="hover:bg-[#f8f9ff]">
                            <td className="py-2 px-3 font-mono text-[#74777e]">#{row.id}</td>
                            <td className="py-2 px-3 font-mono font-bold text-[#001229]">{row.date}</td>
                            <td className="py-2 px-3 font-bold text-[#001229]">
                              {row.product_name} - {row.packet_size}g
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-[#44474d]">
                              {row.planned_qty.toLocaleString()} pkts
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#4059aa]">
                              {row.actual_qty.toLocaleString()} pkts
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold">
                              {!isCompleted ? (
                                <span className="text-slate-400">—</span>
                              ) : variance < 0 ? (
                                <span className="text-[#ba1a1a]">{variance.toLocaleString()}</span>
                              ) : variance > 0 ? (
                                <span className="text-emerald-700">+{variance.toLocaleString()}</span>
                              ) : (
                                <span className="text-slate-600">0</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {isScheduled ? (
                                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300">
                                  SCHEDULED (RESERVED)
                                </span>
                              ) : isAtRisk ? (
                                <span
                                  title={(row.material_shortages || []).map((item) => `${item.material_name}: need ${item.required_qty} ${item.unit}, available ${item.available_qty} ${item.unit}, short ${item.shortage_qty} ${item.unit}`).join('\n') || 'No current material shortage details available.'}
                                  className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-100 text-rose-900 border border-rose-300 cursor-help"
                                >
                                  AT RISK · NOT RESERVED{(row.material_shortages || []).length > 0 ? ` (${row.material_shortages!.length})` : ''}
                                </span>
                              ) : isCompleted ? (
                                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  COMPLETED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-300">
                                  CANCELLED
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-900 font-semibold">
                              {row.total_cost ? `₹${row.total_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-700 font-bold">
                              {row.unit_cost ? `₹${row.unit_cost.toFixed(2)}` : '—'}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                {isAtRisk && (
                                  <>
                                    <button
                                      onClick={async () => {
                                        try {
                                          const res = await api.reserveSchedule(row.id);
                                          showToast(res.message, 'success');
                                          refreshAllMasterData();
                                        } catch (err: any) { showToast(err.message, 'error'); }
                                      }}
                                      className="px-2 py-0.5 rounded bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-semibold"
                                      title="Try reserving all BOM materials after inventory is updated"
                                    >Reserve</button>
                                    <button onClick={() => setCancellingSchedule(row)} className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold">Cancel</button>
                                  </>
                                )}
                                {isScheduled && (
                                  <>
                                    <button
                                      onClick={() => setCompletingSchedule(row)}
                                      className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold"
                                      title="Convert reservation into consumption and finish goods"
                                    >
                                      Complete
                                    </button>
                                    <button
                                      onClick={() => setCancellingSchedule(row)}
                                      className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold"
                                      title="Release reserved raw materials"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                                {isCompleted && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const breakdown = await api.getScheduleCostBreakdown(row.id);
                                        setViewingCostBreakdown(breakdown);
                                      } catch (err: any) {
                                        showToast(err.message, 'error');
                                      }
                                    }}
                                    className="px-2 py-0.5 rounded bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] text-[11px] font-semibold"
                                    title="View Frozen Material Costing Breakdown"
                                  >
                                    Cost Breakdown
                                  </button>
                                )}
                                {(isScheduled || isAtRisk) && (
                                  <button onClick={() => setEditingSchedule(row)} className="px-1.5 py-0.5 text-slate-600 hover:text-slate-900 text-[11px]">Edit</button>
                                )}
                                {status !== 'COMPLETED' && (
                                  <button onClick={() => setDeletingSchedule(row)} className="px-1.5 py-0.5 text-red-600 hover:underline text-[11px]">Delete</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: FEASIBILITY ENGINE */}
          {activeTab === 'feasibility' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-[#001229] tracking-tight">Material Feasibility Engine</h1>
                  <p className="text-[12px] text-[#44474d]">Simulates material requirements across scheduled runs against available stock</p>
                </div>
              </div>

              {/* Date Filter & Actions */}
              <div className="bg-white p-4 rounded border border-[#e5eeff] shadow-2xs flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#44474d]">Run Start Date</label>
                    <input
                      type="date"
                      value={feasibilityStartDate}
                      onChange={(e) => setFeasibilityStartDate(e.target.value)}
                      className="border border-[#cbd5e1] rounded px-3 py-1.5 text-[12.5px] font-mono outline-hidden"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#44474d]">Run End Date</label>
                    <input
                      type="date"
                      value={feasibilityEndDate}
                      onChange={(e) => setFeasibilityEndDate(e.target.value)}
                      className="border border-[#cbd5e1] rounded px-3 py-1.5 text-[12.5px] font-mono outline-hidden"
                    />
                  </div>
                  <button
                    onClick={() => fetchFeasibility(feasibilityStartDate, feasibilityEndDate)}
                    disabled={loadingFeasibility}
                    className="px-4 py-1.5 bg-[#001229] hover:bg-[#4059aa] text-white font-bold rounded text-[12px] shadow-xs flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[15px]">calculate</span>
                    <span>{loadingFeasibility ? 'Calculating...' : 'Run Feasibility Engine'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={exportFeasibilityReport}
                    className="px-3.5 py-1.5 bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-bold rounded text-[12px] flex items-center gap-1.5 border border-[#dce9ff] shadow-2xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">file_download</span>
                    <span>Export Feasibility (CSV)</span>
                  </button>
                </div>
              </div>

              {/* Formula Callout */}
              <div className="p-3 bg-[#eff4ff] border border-[#dce9ff] rounded text-[12px] text-[#0b1c30] flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-[#001229]">MRP Formula:</strong> Pending Target = max(Planned Packets − Actual Packets, 0).
                  Required Quantity = Pending Target × BOM Per Unit. Available Stock = Physical Stock − Reserved Stock.
                  Suggested Procurement = max(0, Required Quantity − Available Stock) (never negative).
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded border border-[#e5eeff] shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[12.5px]">
                    <thead>
                      <tr className="bg-[#f8fafc] text-[#44474d] text-[10px] font-bold uppercase tracking-wider border-b border-[#e5eeff]">
                        <th className="py-2.5 px-3">RAW MATERIAL</th>
                        <th className="py-2.5 px-3 text-right">PHYSICAL STOCK</th>
                        <th className="py-2.5 px-3 text-right">RESERVED STOCK</th>
                        <th className="py-2.5 px-3 text-right font-bold text-blue-900">AVAILABLE STOCK</th>
                        <th className="py-2.5 px-3 text-right font-bold text-slate-900">REQUIRED FOR RUNS</th>
                        <th className="py-2.5 px-3 text-right text-rose-700 font-bold">SHORTAGE</th>
                        <th className="py-2.5 px-3 text-right text-emerald-700 font-bold">SURPLUS BUFFER</th>
                        <th className="py-2.5 px-3 text-right font-bold">SUGGESTED PROCUREMENT</th>
                        <th className="py-2.5 px-3 text-center">FEASIBILITY STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {feasibilityReport && feasibilityReport.length > 0 ? (
                        feasibilityReport.map((row) => (
                          <tr key={row.material_id} className="hover:bg-[#f8f9ff]">
                            <td className="py-2.5 px-3 font-bold text-[#001229]">{row.material_name}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#44474d]">
                              {(row.physical_stock !== undefined ? row.physical_stock : row.available_stock).toFixed(2)} {row.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-amber-700 font-bold">
                              {(row.reserved_stock || 0).toFixed(2)} {row.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                              {row.available_stock.toFixed(2)} {row.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {row.required_qty.toFixed(2)} {row.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                              {row.shortage > 0 ? `-${row.shortage.toFixed(2)} ${row.unit}` : '0.00'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                              {row.surplus > 0 ? `+${row.surplus.toFixed(2)} ${row.unit}` : '0.00'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">
                              {row.procurement_qty > 0 ? `${row.procurement_qty.toFixed(2)} ${row.unit}` : '0.00'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded font-mono font-bold text-[10.5px] ${
                                  row.status === 'Procurement required'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : row.status === 'Sufficient'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                            No production runs scheduled in this date window. Adjust the dates above to calculate material feasibility.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- MODAL: STOCK ADJUSTMENT --- */}
      {isAdjustStockModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-[#0f172a] flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#4059aa]" />
                <span>Manual Stock Adjustment</span>
              </h3>
              <button onClick={() => setIsAdjustStockModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const matId = Number((form.elements.namedItem('material_id') as HTMLSelectElement).value);
                const adjType = (form.elements.namedItem('adj_type') as HTMLSelectElement).value as 'INCREASE' | 'DECREASE';
                const qty = Number((form.elements.namedItem('quantity') as HTMLInputElement).value);
                const reason = (form.elements.namedItem('reason') as HTMLInputElement).value;

                try {
                  const res = await api.adjustStock(matId, {
                    adjustment_type: adjType,
                    quantity: qty,
                    reason,
                  });
                  showToast(res.message, 'success');
                  setIsAdjustStockModalOpen(false);
                  refreshAllMasterData();
                } catch (err: any) {
                  showToast(err.message, 'error');
                }
              }}
              className="p-5 flex flex-col gap-3.5 text-[13px]"
            >
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Select Raw Material *</label>
                <select
                  name="material_id"
                  defaultValue={adjustingMaterial ? adjustingMaterial.id : materials[0]?.id}
                  required
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] bg-white outline-hidden"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.material_name} (Physical: {m.stock_qty} {m.unit}, Avail: {m.available_qty ?? m.stock_qty} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Adjustment Action *</label>
                  <select
                    name="adj_type"
                    required
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] bg-white font-semibold outline-hidden"
                  >
                    <option value="INCREASE">+ Stock Increase (Received / Found)</option>
                    <option value="DECREASE">- Stock Decrease (Damaged / Correction)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Quantity *</label>
                  <input
                    name="quantity"
                    type="number"
                    step="any"
                    min="0.001"
                    required
                    placeholder="e.g. 50"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Adjustment Reason (Mandatory) *</label>
                <input
                  name="reason"
                  type="text"
                  required
                  placeholder="e.g. PO-8921 Vendor Inflow / Damaged bags write-off"
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] outline-hidden"
                />
              </div>

              <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-blue-900 text-[11px]">
                Stock reduction will be blocked if it exceeds physical warehouse inventory. The adjustment and audit history will be logged in an atomic transaction.
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustStockModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-[#475569] font-semibold rounded text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#001229] hover:bg-[#4059aa] text-white font-bold rounded text-[12px]"
                >
                  Commit Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: STOCK MOVEMENTS HISTORY --- */}
      {isMovementsModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-[#0f172a] flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#4059aa]" />
                <span>Stock Movement &amp; Consumption Audit Ledger</span>
              </h3>
              <button onClick={() => setIsMovementsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {stockMovements.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">No stock movements recorded yet.</div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                      <th className="py-2 px-3">TIMESTAMP</th>
                      <th className="py-2 px-3">MATERIAL</th>
                      <th className="py-2 px-3">TYPE</th>
                      <th className="py-2 px-3 text-right">QUANTITY</th>
                      <th className="py-2 px-3 text-right">PREV STOCK</th>
                      <th className="py-2 px-3 text-right">NEW STOCK</th>
                      <th className="py-2 px-3">REASON / AUDIT NOTE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {stockMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-500 text-[11px]">{m.created_at}</td>
                        <td className="py-2 px-3 font-sans font-bold text-slate-900">{m.material_name}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              m.movement_type.includes('INCREASE') || m.movement_type === 'INITIAL_BALANCE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {m.movement_type}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold">
                          {m.movement_type.includes('INCREASE') || m.movement_type === 'INITIAL_BALANCE' ? '+' : '-'}
                          {m.quantity.toFixed(2)} {m.unit}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-500">{m.previous_stock.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{m.new_stock.toFixed(2)}</td>
                        <td className="py-2 px-3 font-sans text-slate-700 text-[11.5px] max-w-xs truncate">{m.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsMovementsModalOpen(false)}
                className="px-4 py-1.5 bg-[#001229] text-white font-semibold rounded text-xs"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: REORDER SUGGESTIONS --- */}
      {isReorderModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-[#0f172a] flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-[#4059aa]" />
                <span>Raw Material Reorder Suggestions</span>
              </h3>
              <button onClick={() => setIsReorderModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <div className="mb-3 p-2.5 rounded bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                Formula: Available Stock = Physical − Reserved. Suggested Purchase = max(0, Minimum Safety Threshold − Available Stock). Quantities are non-negative.
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                    <th className="py-2 px-3">MATERIAL</th>
                    <th className="py-2 px-3 text-right">PHYSICAL</th>
                    <th className="py-2 px-3 text-right text-amber-700">RESERVED</th>
                    <th className="py-2 px-3 text-right font-bold text-blue-900">AVAILABLE</th>
                    <th className="py-2 px-3 text-right">MIN THRESHOLD</th>
                    <th className="py-2 px-3 text-right font-bold text-rose-700">SUGGESTED REORDER</th>
                    <th className="py-2 px-3 text-right">EST. COST</th>
                    <th className="py-2 px-3 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {reorderSuggestions.map((s) => (
                    <tr key={s.material_id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-sans font-bold text-slate-900">{s.material_name}</td>
                      <td className="py-2 px-3 text-right">{s.physical_stock.toFixed(1)} {s.unit}</td>
                      <td className="py-2 px-3 text-right text-amber-700 font-bold">{s.reserved_stock.toFixed(1)}</td>
                      <td className="py-2 px-3 text-right font-bold text-blue-700">{s.available_stock.toFixed(1)}</td>
                      <td className="py-2 px-3 text-right">{s.min_stock_threshold.toFixed(1)}</td>
                      <td className="py-2 px-3 text-right font-bold text-rose-700">
                        {s.suggested_purchase_qty > 0 ? `${s.suggested_purchase_qty.toFixed(1)} ${s.unit}` : '0.0'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        ₹{s.estimated_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            s.status === 'CRITICAL_STOCKOUT'
                              ? 'bg-rose-200 text-rose-900'
                              : s.status === 'BELOW_MINIMUM_THRESHOLD'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {s.status === 'CRITICAL_STOCKOUT'
                            ? 'STOCKOUT'
                            : s.status === 'BELOW_MINIMUM_THRESHOLD'
                            ? 'REORDER NEEDED'
                            : 'SUFFICIENT'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsReorderModalOpen(false)}
                className="px-4 py-1.5 bg-[#001229] text-white font-semibold rounded text-xs"
              >
                Close Suggestions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: COMPLETE PRODUCTION RUN --- */}
      {completingSchedule && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-[#0f172a] flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Complete Production Run #{completingSchedule.id}</span>
              </h3>
              <button onClick={() => setCompletingSchedule(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const actQty = Number((form.elements.namedItem('actual_qty') as HTMLInputElement).value);

                try {
                  const res = await api.completeSchedule(completingSchedule.id, actQty);
                  showToast(res.message, 'success');
                  setCompletingSchedule(null);
                  refreshAllMasterData();
                } catch (err: any) {
                  showToast(err.message, 'error');
                }
              }}
              className="p-5 flex flex-col gap-3.5 text-[13px]"
            >
              <div>
                <span className="text-xs text-slate-500 block">Product Run:</span>
                <strong className="text-slate-900 font-bold block text-sm">
                  {completingSchedule.product_name} - {completingSchedule.packet_size}g
                </strong>
                <span className="font-mono text-xs text-slate-600">
                  Scheduled Date: {completingSchedule.date} • Target: {completingSchedule.planned_qty.toLocaleString()} pkts
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">
                  Actual Packout Output Quantity (pkts) *
                </label>
                <input
                  name="actual_qty"
                  type="number"
                  required
                  min="1"
                  defaultValue={completingSchedule.planned_qty}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden text-sm font-bold"
                />
              </div>

              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                <strong>Inventory Conversion Notice:</strong> Completing this run converts reserved materials into actual warehouse consumption, deducts raw material inventory, increases finished goods stock by the actual packout, and freezes historical material costing for this batch.
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompletingSchedule(null)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-[#475569] font-semibold rounded text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-[12px]"
                >
                  Confirm &amp; Deduct Consumption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: CANCEL PRODUCTION RUN --- */}
      {cancellingSchedule && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden border-t-4 border-t-rose-600">
            <div className="px-5 py-3.5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-rose-900 flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-rose-600" />
                <span>Cancel Production Run #{cancellingSchedule.id}</span>
              </h3>
              <button onClick={() => setCancellingSchedule(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3.5 text-[13px]">
              <p className="text-slate-800">
                Are you sure you want to cancel the scheduled run for{' '}
                <strong>{cancellingSchedule.product_name} - {cancellingSchedule.packet_size}g</strong> ({cancellingSchedule.planned_qty.toLocaleString()} pkts on {cancellingSchedule.date})?
              </p>

              <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                <strong>Reservation Release:</strong> Cancelling this run releases all reserved raw materials back into available stock. Physical warehouse stock will NOT be deducted.
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setCancellingSchedule(null)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded text-xs"
                >
                  Keep Scheduled
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await api.cancelSchedule(cancellingSchedule.id);
                      showToast(res.message, 'success');
                      setCancellingSchedule(null);
                      refreshAllMasterData();
                    } catch (err: any) {
                      showToast(err.message, 'error');
                    }
                  }}
                  className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded text-xs"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: BATCH COST BREAKDOWN --- */}
      {viewingCostBreakdown && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[14.5px] text-[#0f172a] flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span>Production Run #{viewingCostBreakdown.schedule_id} — Material Cost Breakdown</span>
                </h3>
                <span className="text-xs text-slate-500">
                  {viewingCostBreakdown.product_name} • Date: {viewingCostBreakdown.date} • Batch Output: {viewingCostBreakdown.actual_qty.toLocaleString()} pkts
                </span>
              </div>
              <button onClick={() => setViewingCostBreakdown(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
              {/* Cost Summary Strip */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200 font-mono">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase block font-sans font-bold">
                    Total Material Cost
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    ₹{viewingCostBreakdown.total_material_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 uppercase block font-sans font-bold">
                    Unit Material Cost
                  </span>
                  <span className="text-lg font-bold text-emerald-700">
                    ₹{viewingCostBreakdown.unit_material_cost.toFixed(2)} / packet
                  </span>
                </div>
              </div>

              <div className={`text-[11.5px] p-2.5 rounded border ${viewingCostBreakdown.cost_type === 'ACTUAL_HISTORICAL' ? 'text-emerald-900 bg-emerald-50 border-emerald-200' : 'text-amber-900 bg-amber-50 border-amber-200'}`}>
                <strong>{viewingCostBreakdown.cost_type === 'ACTUAL_HISTORICAL' ? 'Verified completion snapshot' : 'Historical data warning'}:</strong> {viewingCostBreakdown.cost_note || 'Historical cost provenance is unavailable.'}
              </div>

              {/* Ingredients Table */}
              <table className="w-full text-left border-collapse text-xs mt-1">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                    <th className="py-2 px-3">RAW MATERIAL</th>
                    <th className="py-2 px-3 text-right">UNIT COST AT RUN</th>
                    <th className="py-2 px-3 text-right">QUANTITY CONSUMED</th>
                    <th className="py-2 px-3 text-right">TOTAL INGREDIENT COST</th>
                    <th className="py-2 px-3 text-right">COST SHARE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {viewingCostBreakdown.materials.map((m) => (
                    <tr key={m.id || m.material_id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-sans font-bold text-slate-900">{m.material_name}</td>
                      <td className="py-2 px-3 text-right">₹{m.unit_cost.toFixed(2)} / {m.unit || m.material_unit}</td>
                      <td className="py-2 px-3 text-right font-bold text-blue-800">
                        {m.qty_used.toFixed(2)} {m.unit || m.material_unit}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        ₹{m.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-700 font-bold">
                        {m.cost_share_pct ? `${m.cost_share_pct.toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingCostBreakdown(null)}
                className="px-4 py-1.5 bg-[#001229] text-white font-semibold rounded text-xs"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD RAW MATERIAL --- */}
      {isAddMaterialModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-[#0f172a]">Register New Raw Material</h3>
              <button onClick={() => setIsAddMaterialModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const data = {
                  material_name: (form.elements.namedItem('material_name') as HTMLInputElement).value,
                  unit: (form.elements.namedItem('unit') as HTMLInputElement).value,
                  stock_qty: Number((form.elements.namedItem('stock_qty') as HTMLInputElement).value),
                  cost_per_unit: Number((form.elements.namedItem('cost_per_unit') as HTMLInputElement).value),
                  min_stock_threshold: Number((form.elements.namedItem('min_stock_threshold') as HTMLInputElement).value),
                };
                try {
                  const res = await api.createMaterial(data);
                  showToast(res.message);
                  setIsAddMaterialModalOpen(false);
                  refreshAllMasterData();
                } catch (err: any) {
                  showToast(err.message, 'error');
                }
              }}
              className="p-5 flex flex-col gap-3.5 text-[13px]"
            >
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Material Name *</label>
                <input
                  name="material_name"
                  type="text"
                  required
                  placeholder="e.g. Dehydrated Onion Powder"
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Unit of Measure *</label>
                  <input
                    name="unit"
                    type="text"
                    required
                    placeholder="kg, L, pouch, pcs"
                    defaultValue="kg"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Cost Per Unit (₹) *</label>
                  <input
                    name="cost_per_unit"
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="0.00"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Initial Physical Stock *</label>
                  <input
                    name="stock_qty"
                    type="number"
                    step="any"
                    min="0"
                    required
                    defaultValue="0"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Min Safety Threshold *</label>
                  <input
                    name="min_stock_threshold"
                    type="number"
                    step="any"
                    min="0"
                    required
                    defaultValue="50"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMaterialModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-[#475569] font-semibold rounded text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#001229] hover:bg-[#4059aa] text-white font-bold rounded text-[12px]"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: EDIT RAW MATERIAL --- */}
      {editingMaterial && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-[#0f172a]">Edit Material: #{editingMaterial.id}</h3>
              <button onClick={() => setEditingMaterial(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const data = {
                  material_name: (form.elements.namedItem('material_name') as HTMLInputElement).value,
                  unit: (form.elements.namedItem('unit') as HTMLInputElement).value,
                  stock_qty: Number((form.elements.namedItem('stock_qty') as HTMLInputElement).value),
                  cost_per_unit: Number((form.elements.namedItem('cost_per_unit') as HTMLInputElement).value),
                  min_stock_threshold: Number((form.elements.namedItem('min_stock_threshold') as HTMLInputElement).value),
                };
                try {
                  const res = await api.updateMaterial(editingMaterial.id, data);
                  showToast(res.message);
                  setEditingMaterial(null);
                  refreshAllMasterData();
                } catch (err: any) {
                  showToast(err.message, 'error');
                }
              }}
              className="p-5 flex flex-col gap-3.5 text-[13px]"
            >
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Material Name *</label>
                <input
                  name="material_name"
                  type="text"
                  required
                  defaultValue={editingMaterial.material_name}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Unit of Measure *</label>
                  <input
                    name="unit"
                    type="text"
                    required
                    defaultValue={editingMaterial.unit}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Cost Per Unit (₹) *</label>
                  <input
                    name="cost_per_unit"
                    type="number"
                    step="any"
                    min="0"
                    required
                    defaultValue={editingMaterial.cost_per_unit}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Physical Stock *</label>
                  <input
                    name="stock_qty"
                    type="number"
                    step="any"
                    min="0"
                    required
                    defaultValue={editingMaterial.stock_qty}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Min Safety Threshold *</label>
                  <input
                    name="min_stock_threshold"
                    type="number"
                    step="any"
                    min="0"
                    required
                    defaultValue={editingMaterial.min_stock_threshold || 0}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-[#475569] font-semibold rounded text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#001229] hover:bg-[#4059aa] text-white font-bold rounded text-[12px]"
                >
                  Update Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: DELETE RAW MATERIAL --- */}
      {deletingMaterial && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden border-t-4 border-t-rose-600">
            <div className="px-5 py-3.5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-rose-900">Delete Material #{deletingMaterial.id}</h3>
              <button onClick={() => setDeletingMaterial(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-3.5 text-[13px]">
              <p className="text-slate-800">
                Are you sure you want to delete raw material <strong>{deletingMaterial.material_name}</strong>?
              </p>
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                Materials referenced in active Bill of Materials (BOM) recipes or production schedule reservations cannot be deleted without first removing those dependencies.
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setDeletingMaterial(null)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await api.deleteMaterial(deletingMaterial.id);
                      showToast(res.message);
                      setDeletingMaterial(null);
                      refreshAllMasterData();
                    } catch (err: any) {
                      showToast(err.message, 'error');
                    }
                  }}
                  className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded text-xs"
                >
                  Confirm Deletion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD PRODUCT --- */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-[#0f172a]">Register Finished Product</h3>
              <button onClick={() => setIsAddProductModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const data = {
                  name: (form.elements.namedItem('name') as HTMLInputElement).value,
                  packet_size: Number((form.elements.namedItem('packet_size') as HTMLInputElement).value),
                  stock_qty: Number((form.elements.namedItem('stock_qty') as HTMLInputElement).value),
                  mrp: Number((form.elements.namedItem('mrp') as HTMLInputElement).value),
                };
                try {
                  const res = await api.createProduct(data);
                  showToast(res.message);
                  setIsAddProductModalOpen(false);
                  refreshAllMasterData();
                } catch (err: any) {
                  showToast(err.message, 'error');
                }
              }}
              className="p-5 flex flex-col gap-3.5 text-[13px]"
            >
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Product Variety / SKU Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Cream & Onion"
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] outline-hidden"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Packet Size (g) *</label>
                  <input
                    name="packet_size"
                    type="number"
                    required
                    defaultValue="25"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Stock (pkts) *</label>
                  <input
                    name="stock_qty"
                    type="number"
                    required
                    defaultValue="0"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">MRP (₹) *</label>
                  <input
                    name="mrp"
                    type="number"
                    step="any"
                    required
                    defaultValue="10"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-[#475569] font-semibold rounded text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#001229] hover:bg-[#4059aa] text-white font-bold rounded text-[12px]"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: EDIT PRODUCT --- */}
      {editingProduct && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-[#0f172a]">Edit Product: #{editingProduct.id}</h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const data = {
                  name: (form.elements.namedItem('name') as HTMLInputElement).value,
                  packet_size: Number((form.elements.namedItem('packet_size') as HTMLInputElement).value),
                  stock_qty: Number((form.elements.namedItem('stock_qty') as HTMLInputElement).value),
                  mrp: Number((form.elements.namedItem('mrp') as HTMLInputElement).value),
                };
                try {
                  const res = await api.updateProduct(editingProduct.id, data);
                  showToast(res.message);
                  setEditingProduct(null);
                  refreshAllMasterData();
                } catch (err: any) {
                  showToast(err.message, 'error');
                }
              }}
              className="p-5 flex flex-col gap-3.5 text-[13px]"
            >
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Product Variety / SKU Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingProduct.name}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] outline-hidden"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Packet Size (g) *</label>
                  <input
                    name="packet_size"
                    type="number"
                    required
                    defaultValue={editingProduct.packet_size}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Stock (pkts) *</label>
                  <input
                    name="stock_qty"
                    type="number"
                    required
                    defaultValue={editingProduct.stock_qty}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">MRP (₹) *</label>
                  <input
                    name="mrp"
                    type="number"
                    step="any"
                    required
                    defaultValue={editingProduct.mrp}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-[#475569] font-semibold rounded text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#001229] hover:bg-[#4059aa] text-white font-bold rounded text-[12px]"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: DELETE PRODUCT --- */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden border-t-4 border-t-rose-600">
            <div className="px-5 py-3.5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-rose-900">Delete Product #{deletingProduct.id}</h3>
              <button onClick={() => setDeletingProduct(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-3.5 text-[13px]">
              <p className="text-slate-800">
                Are you sure you want to delete product <strong>{deletingProduct.name} - {deletingProduct.packet_size}g</strong>?
              </p>
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                Products referenced by active BOM recipes or scheduled production runs cannot be deleted without removing associations first.
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setDeletingProduct(null)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await api.deleteProduct(deletingProduct.id);
                      showToast(res.message);
                      setDeletingProduct(null);
                      refreshAllMasterData();
                    } catch (err: any) {
                      showToast(err.message, 'error');
                    }
                  }}
                  className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded text-xs"
                >
                  Confirm Deletion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD BOM RECIPE --- */}
      {isAddBOMModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-[#0f172a]">Add Bill of Materials Recipe Line</h3>
              <button onClick={() => setIsAddBOMModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const data = {
                  product_id: Number((form.elements.namedItem('product_id') as HTMLSelectElement).value),
                  material_id: Number((form.elements.namedItem('material_id') as HTMLSelectElement).value),
                  qty_required: Number((form.elements.namedItem('qty_required') as HTMLInputElement).value),
                };
                try {
                  const res = await api.createBOM(data);
                  showToast(res.message);
                  setIsAddBOMModalOpen(false);
                  refreshAllMasterData();
                } catch (err: any) {
                  showToast(err.message, 'error');
                }
              }}
              className="p-5 flex flex-col gap-3.5 text-[13px]"
            >
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Finished Product *</label>
                <select
                  name="product_id"
                  required
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] bg-white outline-hidden"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.packet_size}g)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Raw Material *</label>
                <select
                  name="material_id"
                  required
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] bg-white outline-hidden"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.material_name} ({m.unit}) — ₹{m.cost_per_unit}/unit
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Quantity Required Per Packet *</label>
                <input
                  name="qty_required"
                  type="number"
                  step="any"
                  min="0.000001"
                  required
                  placeholder="e.g. 0.05"
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBOMModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-[#475569] font-semibold rounded text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#001229] hover:bg-[#4059aa] text-white font-bold rounded text-[12px]"
                >
                  Save BOM Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: EDIT BOM RECIPE --- */}
      {editingBOM && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-[#0f172a]">Edit Recipe #{editingBOM.id}</h3>
              <button onClick={() => setEditingBOM(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const qty = Number((form.elements.namedItem('qty_required') as HTMLInputElement).value);
                try {
                  const res = await api.updateBOM(editingBOM.id, { qty_required: qty });
                  showToast(res.message);
                  setEditingBOM(null);
                  refreshAllMasterData();
                } catch (err: any) {
                  showToast(err.message, 'error');
                }
              }}
              className="p-5 flex flex-col gap-3.5 text-[13px]"
            >
              <div>
                <span className="text-xs text-slate-500 block">Recipe Association:</span>
                <strong className="text-slate-900 block font-bold">
                  {editingBOM.product_name} ({editingBOM.packet_size}g)
                </strong>
                <span className="text-slate-700 text-xs">
                  Ingredient: {editingBOM.material_name} ({editingBOM.unit})
                </span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">
                  Quantity Required Per Packet ({editingBOM.unit}) *
                </label>
                <input
                  name="qty_required"
                  type="number"
                  step="any"
                  min="0.000001"
                  required
                  defaultValue={editingBOM.qty_required}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBOM(null)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-[#475569] font-semibold rounded text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#001229] hover:bg-[#4059aa] text-white font-bold rounded text-[12px]"
                >
                  Update Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: DELETE BOM RECIPE --- */}
      {deletingBOM && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden border-t-4 border-t-rose-600">
            <div className="px-5 py-3.5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-rose-900">Delete BOM Recipe #{deletingBOM.id}</h3>
              <button onClick={() => setDeletingBOM(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-3.5 text-[13px]">
              <p className="text-slate-800">
                Are you sure you want to remove recipe line for{' '}
                <strong>{deletingBOM.material_name}</strong> from{' '}
                <strong>{deletingBOM.product_name} - {deletingBOM.packet_size}g</strong>?
              </p>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setDeletingBOM(null)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await api.deleteBOM(deletingBOM.id);
                      showToast(res.message);
                      setDeletingBOM(null);
                      refreshAllMasterData();
                    } catch (err: any) {
                      showToast(err.message, 'error');
                    }
                  }}
                  className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded text-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: SCHEDULE PRODUCTION RUN & VERIFY RESERVATIONS --- */}
      {isAddScheduleModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-[#0f172a] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#4059aa]" />
                <span>Schedule New Production Run</span>
              </h3>
              <button onClick={() => setIsAddScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const data = {
                  product_id: Number((form.elements.namedItem('product_id') as HTMLSelectElement).value),
                  date: (form.elements.namedItem('date') as HTMLInputElement).value,
                  planned_qty: Number((form.elements.namedItem('planned_qty') as HTMLInputElement).value),
                  actual_qty: 0,
                };
                try {
                  const res = await api.createSchedule(data);
                  showToast(res.message, 'success');
                  setIsAddScheduleModalOpen(false);
                  refreshAllMasterData();
                } catch (err: any) {
                  showToast(err.message, 'error');
                }
              }}
              className="p-5 flex flex-col gap-3.5 text-[13px]"
            >
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Product to Produce *</label>
                <select
                  name="product_id"
                  required
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] bg-white outline-hidden"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.packet_size}g)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Production Date *</label>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={getTodayString()}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Planned Target (pkts) *</label>
                  <input
                    name="planned_qty"
                    type="number"
                    min="1"
                    required
                    defaultValue="5000"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden font-bold"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-relaxed">
                <strong>Planning is independent of stock availability.</strong> You can create the production plan even when materials are short. If every BOM requirement is available, stock is reserved automatically; otherwise the plan is saved as <strong>AT RISK</strong> with no partial reservations. Update Raw Materials after actual receipt, then use Reserve on the plan.
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-[#475569] font-semibold rounded text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#001229] hover:bg-[#4059aa] text-white font-bold rounded text-[12px]"
                >
                  Create Production Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: EDIT SCHEDULE --- */}
      {editingSchedule && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-[#0f172a]">Edit Schedule Run #{editingSchedule.id}</h3>
              <button onClick={() => setEditingSchedule(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const data = {
                  date: (form.elements.namedItem('date') as HTMLInputElement).value,
                  planned_qty: Number((form.elements.namedItem('planned_qty') as HTMLInputElement).value),
                  actual_qty: 0,
                };
                try {
                  const res = await api.updateSchedule(editingSchedule.id, data);
                  showToast(res.message);
                  setEditingSchedule(null);
                  refreshAllMasterData();
                } catch (err: any) {
                  showToast(err.message, 'error');
                }
              }}
              className="p-5 flex flex-col gap-3.5 text-[13px]"
            >
              <div>
                <span className="text-xs text-slate-500 block">Product:</span>
                <strong className="text-slate-900 block font-bold">
                  {editingSchedule.product_name} - {editingSchedule.packet_size}g
                </strong>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Date *</label>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={editingSchedule.date}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Planned Target *</label>
                  <input
                    name="planned_qty"
                    type="number"
                    min="1"
                    required
                    defaultValue={editingSchedule.planned_qty}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-[#0f172a] font-mono outline-hidden font-bold"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">Actual output is recorded only when you complete the production run.</p>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSchedule(null)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-[#475569] font-semibold rounded text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#001229] hover:bg-[#4059aa] text-white font-bold rounded text-[12px]"
                >
                  Update Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: DELETE SCHEDULE --- */}
      {deletingSchedule && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden border-t-4 border-t-rose-600">
            <div className="px-5 py-3.5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-rose-900">Delete Production Schedule #{deletingSchedule.id}</h3>
              <button onClick={() => setDeletingSchedule(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-3.5 text-[13px]">
              <p className="text-slate-800">
                Are you sure you want to remove scheduled run #{deletingSchedule.id} ({deletingSchedule.product_name} on {deletingSchedule.date})?
              </p>
              <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                Any active stock reservations locked by this run will be safely released back into available inventory.
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setDeletingSchedule(null)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await api.deleteSchedule(deletingSchedule.id);
                      showToast(res.message);
                      setDeletingSchedule(null);
                      refreshAllMasterData();
                    } catch (err: any) {
                      showToast(err.message, 'error');
                    }
                  }}
                  className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded text-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
