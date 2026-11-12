import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { MaterialInventoryResponse } from '../types';
import { Package, ShieldAlert, CheckCircle, Info } from 'lucide-react';

interface Props {
  data: MaterialInventoryResponse | null;
  loading: boolean;
}

export const MaterialInventory: React.FC<Props> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="h-80 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded p-6">
        <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
          Querying Raw Material Stock Movement Ledger...
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-80 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded p-6 text-center">
        <span className="text-sm font-semibold text-slate-700">No Raw Material Selected</span>
        <p className="text-xs text-slate-500 mt-1">Select a raw material from the selector to view inventory movements.</p>
      </div>
    );
  }

  const { current_stock_summary, selected_material, data: points, summary } = data;
  const unit = current_stock_summary?.unit || 'units';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-300 rounded shadow-md text-xs font-mono">
          <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1.5 flex items-center justify-between gap-4">
            <span>Date: {label}</span>
            <span className="text-[10px] text-slate-500 font-normal">
              {selected_material?.material_name || 'Selected Ingredient'}
            </span>
          </div>
          <div className="space-y-1">
            {(p.opening_balance_qty || 0) > 0 && (
              <div className="flex justify-between gap-4 text-slate-600">
                <span>Opening Balance:</span>
                <span className="font-bold">{(p.opening_balance_qty || 0).toLocaleString()} {unit}</span>
              </div>
            )}
            <div className="flex justify-between gap-4 text-emerald-700">
              <span>Stock Inflow:</span>
              <span className="font-bold">+{p.procurement_qty.toLocaleString()} {unit}</span>
            </div>
            {p.consumption_qty !== undefined && p.consumption_qty > 0 && (
              <div className="flex justify-between gap-4 text-rose-700">
                <span>Production Consumption:</span>
                <span className="font-bold">-{p.consumption_qty.toLocaleString()} {unit}</span>
              </div>
            )}
            {(p.adjustment_outflow || 0) > 0 && (
              <div className="flex justify-between gap-4 text-orange-700">
                <span>Other Stock Decrease:</span>
                <span className="font-bold">-{(p.adjustment_outflow || 0).toLocaleString()} {unit}</span>
              </div>
            )}
            <div className="flex justify-between gap-4 text-blue-800 border-t border-slate-100 pt-1">
              <span>Remaining Warehouse Stock:</span>
              <span className="font-bold">{p.remaining_stock.toLocaleString()} {unit}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Live Current Stock, Reserved Stock & Minimum Threshold Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-white p-3.5 border border-slate-200 rounded">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Physical Warehouse Stock
          </span>
          <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
            {current_stock_summary.on_hand_stock.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">{unit}</span>
          </span>
          <span className="text-[11px] text-slate-500 block">Total physical count</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
            Reserved for Production
          </span>
          <span className="font-mono text-lg font-bold text-amber-700 tabular-nums">
            {(current_stock_summary.reserved_stock || 0).toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">{unit}</span>
          </span>
          <span className="text-[11px] text-slate-500 block">Locked by scheduled runs</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
            Net Available Stock
          </span>
          <span className="font-mono text-lg font-bold text-blue-700 tabular-nums">
            {(current_stock_summary.available_stock !== undefined
              ? current_stock_summary.available_stock
              : current_stock_summary.on_hand_stock - (current_stock_summary.reserved_stock || 0)
            ).toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">{unit}</span>
          </span>
          <span className="text-[11px] text-slate-500 block">Physical − Reserved</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Safety Reorder Threshold
          </span>
          <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
            {(current_stock_summary.min_stock_threshold || 0).toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">{unit}</span>
          </span>
          <span className="text-[11px] text-slate-500 block">Minimum buffer level</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Inventory Valuation
          </span>
          <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
            ₹{current_stock_summary.total_valuation_inr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-slate-500 block">
            @ ₹{current_stock_summary.cost_per_unit.toFixed(2)} / {unit}
          </span>
        </div>
      </div>

      {/* 2. Interactive Real Database Graph */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Graph 3: Raw Material Stock Inflow vs Remaining Stock
            </h3>
            <span className="text-xs text-slate-500">
              Material: <strong className="text-slate-800">{selected_material ? selected_material.material_name : 'Selected Ingredient'}</strong> (ID #{selected_material?.id})
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></span>
              <span className="font-semibold text-emerald-800">Stock Inflow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
              <span className="font-semibold text-blue-900">Remaining Stock</span>
            </div>
          </div>
        </div>

        {points && points.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 10, right: 25, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Line
                  name="Stock Inflow"
                  type="monotone"
                  dataKey="procurement_qty"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#16a34a' }}
                />
                <Line
                  name="Remaining Warehouse Stock"
                  type="monotone"
                  dataKey="remaining_stock"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded border border-slate-200 text-center p-4">
            <Package className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-xs font-semibold text-slate-700">No Stock Movements in Selected Date Range</span>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
              Adjust the date boundaries above or record a stock adjustment to visualize inventory curves.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
