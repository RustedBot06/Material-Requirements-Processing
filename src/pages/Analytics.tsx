import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  RotateCcw,
  Download,
  Calendar,
  Layers,
  RefreshCw,
  Coins,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../services/api';
import {
  Product,
  Material,
  ProductionComparisonResponse,
  ProductionShortfallResponse,
  MaterialInventoryResponse,
  CostTrendPoint,
} from '../types';
import { ProductionComparison } from '../charts/ProductionComparison';
import { ProductionShortfall } from '../charts/ProductionShortfall';
import { MaterialInventory } from '../charts/MaterialInventory';

interface Props {
  products: Product[];
  materials: Material[];
  onShowToast: (message: string, type?: 'success' | 'error', title?: string) => void;
}

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

export const Analytics: React.FC<Props> = ({ products, materials, onShowToast }) => {
  const today = getTodayString();

  // Filters - Default Start Date and End Date to current local date dynamically
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | undefined>(
    materials.length > 0 ? materials[0].id : undefined
  );

  // Active chart view
  const [activeTab, setActiveTab] = useState<'all' | 'comparison' | 'shortfall' | 'inventory' | 'cost_trends'>('all');

  // Chart Data States
  const [comparisonData, setComparisonData] = useState<ProductionComparisonResponse | null>(null);
  const [shortfallData, setShortfallData] = useState<ProductionShortfallResponse | null>(null);
  const [inventoryData, setInventoryData] = useState<MaterialInventoryResponse | null>(null);
  const [costTrends, setCostTrends] = useState<CostTrendPoint[]>([]);

  // Loading States
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [loadingShortfall, setLoadingShortfall] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingCostTrends, setLoadingCostTrends] = useState(false);

  const fetchComparison = async (prodId = selectedProductId, start = startDate, end = endDate) => {
    setLoadingComparison(true);
    try {
      const data = await api.getProductionComparison({ productId: prodId, startDate: start, endDate: end });
      setComparisonData(data);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load production comparison data', 'error');
    } finally {
      setLoadingComparison(false);
    }
  };

  const fetchShortfall = async (prodId = selectedProductId, start = startDate, end = endDate) => {
    setLoadingShortfall(true);
    try {
      const data = await api.getProductionShortfall({ productId: prodId, startDate: start, endDate: end });
      setShortfallData(data);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load production shortfall data', 'error');
    } finally {
      setLoadingShortfall(false);
    }
  };

  const fetchInventory = async (matId = selectedMaterialId, start = startDate, end = endDate) => {
    setLoadingInventory(true);
    try {
      const data = await api.getMaterialInventory({ materialId: matId, startDate: start, endDate: end });
      setInventoryData(data);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load material inventory data', 'error');
    } finally {
      setLoadingInventory(false);
    }
  };

  const fetchCostTrends = async (prodId = selectedProductId) => {
    setLoadingCostTrends(true);
    try {
      const data = await api.getCostTrends(prodId);
      setCostTrends(data);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load historical cost trends', 'error');
    } finally {
      setLoadingCostTrends(false);
    }
  };

  const refreshAll = () => {
    fetchComparison(selectedProductId, startDate, endDate);
    fetchShortfall(selectedProductId, startDate, endDate);
    fetchInventory(selectedMaterialId, startDate, endDate);
    fetchCostTrends(selectedProductId);
    onShowToast('Analytics graphs refreshed from database', 'success');
  };

  useEffect(() => {
    if (!selectedMaterialId && materials.length > 0) {
      setSelectedMaterialId(materials[0].id);
    }
  }, [materials]);

  useEffect(() => {
    fetchComparison(selectedProductId, startDate, endDate);
    fetchShortfall(selectedProductId, startDate, endDate);
    fetchInventory(selectedMaterialId, startDate, endDate);
    fetchCostTrends(selectedProductId);
  }, [selectedProductId, selectedMaterialId, startDate, endDate]);

  const applyPreset = (preset: 'today' | '7days' | '30days' | 'all') => {
    const curToday = getTodayString();
    if (preset === 'today') {
      setStartDate(curToday);
      setEndDate(curToday);
    } else if (preset === '7days') {
      setStartDate(getSevenDaysAgoString());
      setEndDate(curToday);
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      setStartDate(s);
      setEndDate(curToday);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const resetFilters = () => {
    setSelectedProductId(undefined);
    if (materials.length > 0) setSelectedMaterialId(materials[0].id);
    setStartDate(today);
    setEndDate(today);
    onShowToast('Filters reset to current date', 'success');
  };

  const exportAnalyticsCSV = () => {
    let csv = 'Chips MRP - Manufacturing Analytics Report\n';
    csv += `Export Timestamp: ${new Date().toISOString()}\n`;
    csv += `Date Range: ${startDate || 'All'} to ${endDate || 'All'}\n\n`;

    if (comparisonData && comparisonData.data.length > 0) {
      csv += 'GRAPH 1: PLANNED VS ACTUAL PRODUCTION\n';
      csv += 'Date,Planned Quantity,Actual Quantity,Variance,Achievement %\n';
      comparisonData.data.forEach((r) => {
        csv += `"${r.date}",${r.planned_qty},${r.actual_qty},${r.variance},${r.achievement_pct}%\n`;
      });
      csv += `Summary: Planned = ${comparisonData.summary.total_planned}, Actual = ${comparisonData.summary.total_actual}, Net Variance = ${comparisonData.summary.net_variance}\n\n`;
    }

    if (shortfallData && shortfallData.data.length > 0) {
      csv += 'GRAPH 2: PRODUCTION SHORTFALL & SURPLUS ANALYSIS\n';
      csv += 'Date,Actual Output,Planned Target,Variance,Shortfall,Surplus\n';
      shortfallData.data.forEach((r) => {
        csv += `"${r.date}",${r.actual_qty},${r.planned_qty},${r.variance || (r.actual_qty - r.planned_qty)},${r.shortfall},${r.surplus || 0}\n`;
      });
      csv += `Summary: Total Shortfall = ${shortfallData.summary.total_shortfall}, Total Surplus = ${shortfallData.summary.total_surplus || 0}\n\n`;
    }

    if (inventoryData && inventoryData.data.length > 0) {
      csv += 'GRAPH 3: RAW MATERIAL STOCK INFLOWS & MOVEMENTS\n';
      csv += `Material: "${inventoryData.current_stock_summary.material_name}" (${inventoryData.current_stock_summary.unit})\n`;
      csv += 'Date,Opening Balance,Stock Inflow,Production Consumption,Other Stock Decrease,Remaining Stock\n';
      inventoryData.data.forEach((r) => {
        csv += `"${r.date}",${r.opening_balance_qty || 0},${r.procurement_qty},${r.consumption_qty || 0},${r.adjustment_outflow || 0},${r.remaining_stock}\n`;
      });
      csv += '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Chips_MRP_Analytics_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Analytics report exported as CSV', 'success');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manufacturing Analytics</h1>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
              Database-Backed MRP Visualizations
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Production output tracking, variance &amp; shortfall analysis, and raw material inventory movements.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={refreshAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh All Analytics Feeds"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Refresh Analytics</span>
          </button>

          <button
            onClick={exportAnalyticsCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
            title="Export CSV of Analytics Data"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Analytics CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Preset Controls */}
      <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Date Range:</span>
          </span>
          <div className="flex items-center gap-1.5 font-mono bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-slate-800 text-xs focus:outline-none"
              title="Start Date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-slate-800 text-xs focus:outline-none"
              title="End Date"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={() => applyPreset('today')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                startDate === today && endDate === today ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => applyPreset('7days')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                startDate === getSevenDaysAgoString() && endDate === today ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => applyPreset('all')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                !startDate && !endDate ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Records
            </button>
            {(startDate !== today || endDate !== today || selectedProductId !== undefined) && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 ml-1"
                title="Reset to Today"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* View Selection Tabs */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Graphs
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'comparison' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Planned vs Actual
          </button>
          <button
            onClick={() => setActiveTab('shortfall')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'shortfall' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Variance &amp; Shortfall
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Raw Materials Stock
          </button>
          <button
            onClick={() => setActiveTab('cost_trends')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'cost_trends' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Batch Cost Trends
          </button>
        </div>
      </div>

      {/* GRAPH 1: Planned vs Actual Production (Product & Date Filter Only) */}
      {(activeTab === 'all' || activeTab === 'comparison') && (
        <div className="flex flex-col gap-2">
          {/* Graph Specific Relevant Filters */}
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="font-bold text-xs text-slate-800">
              Graph 1 Filter: Product Line Selection
            </span>
            <div className="flex items-center gap-2 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedProductId || ''}
                onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : undefined)}
                className="text-xs font-mono bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900"
              >
                <option value="">All Finished Products (Aggregated)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {p.packet_size}g
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ProductionComparison data={comparisonData} loading={loadingComparison} />
        </div>
      )}

      {/* GRAPH 2: Actual Production vs Variance (Product & Date Filter Only) */}
      {(activeTab === 'all' || activeTab === 'shortfall') && (
        <div className="flex flex-col gap-2">
          {/* Graph Specific Relevant Filters */}
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="font-bold text-xs text-slate-800">
              Graph 2 Filter: Product Line Selection
            </span>
            <div className="flex items-center gap-2 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedProductId || ''}
                onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : undefined)}
                className="text-xs font-mono bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900"
              >
                <option value="">All Finished Products (Aggregated)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {p.packet_size}g
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ProductionShortfall data={shortfallData} loading={loadingShortfall} />
        </div>
      )}

      {/* GRAPH 3: Raw Material Stock Inflow vs Remaining Stock (Raw Material & Date Filter Only) */}
      {(activeTab === 'all' || activeTab === 'inventory') && (
        <div className="flex flex-col gap-2">
          {/* Graph Specific Relevant Filters: ONLY Raw Material is relevant here! */}
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="font-bold text-xs text-slate-800">
              Graph 3 Filter: Raw Material Selection (Relevant Filter Only)
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-[16px] text-slate-500">inventory_2</span>
              <select
                value={selectedMaterialId || ''}
                onChange={(e) => setSelectedMaterialId(Number(e.target.value))}
                className="text-xs font-mono bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.material_name} ({m.unit}) — ID #{m.id}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <MaterialInventory data={inventoryData} loading={loadingInventory} />
        </div>
      )}

      {/* COST TRENDS SECTION */}
      {(activeTab === 'all' || activeTab === 'cost_trends') && (
        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>Historical Production Batch Costing &amp; Unit Cost Trends</span>
              </h3>
              <p className="text-xs text-slate-500">
                Completed batches retain their stored cost. Legacy snapshots are labelled unverified when the original completion ledger is missing.
              </p>
            </div>
          </div>

          {loadingCostTrends ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-500">
              Loading batch costing records...
            </div>
          ) : costTrends.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-center text-xs text-slate-500 bg-slate-50 rounded">
              <span>No completed production batches recorded yet.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-mono text-[10.5px] border-b border-slate-200">
                    <th className="py-2 px-3">RUN ID</th>
                    <th className="py-2 px-3">DATE</th>
                    <th className="py-2 px-3">PRODUCT</th>
                    <th className="py-2 px-3 text-right">BATCH OUTPUT</th>
                    <th className="py-2 px-3 text-right">TOTAL MATERIAL COST</th>
                    <th className="py-2 px-3 text-right">UNIT MATERIAL COST</th>
                    <th className="py-2 px-3 text-center">COST SOURCE</th>
                    <th className="py-2 px-3 text-center">COMPLETED TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {costTrends.map((t) => (
                    <tr key={t.schedule_id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500">#{t.schedule_id}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{t.date}</td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-900">
                        {t.product_name} - {t.packet_size}g
                      </td>
                      <td className="py-2 px-3 text-right text-blue-700 font-bold">
                        {t.actual_qty.toLocaleString()} pkts
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        ₹{t.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">
                        ₹{t.unit_cost.toFixed(2)} / pkt
                      </td>
                      <td className="py-2 px-3 text-center text-[10px] font-bold">
                        {t.cost_source === 'ACTUAL_HISTORICAL' ? (
                          <span className="text-emerald-700">VERIFIED SNAPSHOT</span>
                        ) : (
                          <span className="text-amber-700">LEGACY · UNVERIFIED</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500 text-[11px]">
                        {t.completed_at || 'Completed'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
