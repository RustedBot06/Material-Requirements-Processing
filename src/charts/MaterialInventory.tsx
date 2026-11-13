
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
import { Package } from 'lucide-react';

interface Props {
  data: MaterialInventoryResponse | null;
  loading: boolean;
}

type ChartPoint = {
  date: string;
  procurement_qty: number;
  total_outflow: number;
  consumption_qty: number;
  adjustment_outflow: number;
  opening_balance_qty: number;
  remaining_stock: number;
};

const asNumber = (value: number | undefined | null): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatQty = (value: number): string =>
  value.toLocaleString(undefined, { maximumFractionDigits: 2 });

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
        <p className="text-xs text-slate-500 mt-1">
          Select a raw material from the selector to view inventory movements.
        </p>
      </div>
    );
  }

  const {
    current_stock_summary: stock,
    selected_material: material,
    data: points,
  } = data;

  const unit = stock?.unit || material?.unit || 'units';

  // The API returns consumption and manual decreases as positive quantities.
  // Combine them for the red outflow series.
  const chartData: ChartPoint[] = (points || []).map((point) => {
    const consumption = asNumber(point.consumption_qty);
    const adjustment = asNumber(point.adjustment_outflow);

    return {
      date: point.date,
      procurement_qty: asNumber(point.procurement_qty),
      total_outflow: consumption + adjustment,
      consumption_qty: consumption,
      adjustment_outflow: adjustment,
      opening_balance_qty: asNumber(point.opening_balance_qty),
      remaining_stock: asNumber(point.remaining_stock),
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const point = payload[0]?.payload as ChartPoint | undefined;
    if (!point) return null;

    return (
      <div className="bg-white p-3 border border-slate-300 rounded shadow-md text-xs font-mono min-w-56">
        <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1.5 flex items-center justify-between gap-4">
          <span>Date: {label}</span>
          <span className="text-[10px] text-slate-500 font-normal">
            {material?.material_name || stock?.material_name || 'Selected Ingredient'}
          </span>
        </div>

        <div className="space-y-1">
          {point.opening_balance_qty !== 0 && (
            <div className="flex justify-between gap-4 text-slate-600">
              <span>Opening Balance:</span>
              <span className="font-bold">
                {formatQty(point.opening_balance_qty)} {unit}
              </span>
            </div>
          )}

          <div className="flex justify-between gap-4 text-emerald-700">
            <span>Stock Inflow:</span>
            <span className="font-bold">
              +{formatQty(point.procurement_qty)} {unit}
            </span>
          </div>

          {point.consumption_qty > 0 && (
            <div className="flex justify-between gap-4 text-rose-700">
              <span>Production Consumption:</span>
              <span className="font-bold">
                -{formatQty(point.consumption_qty)} {unit}
              </span>
            </div>
          )}

          {point.adjustment_outflow > 0 && (
            <div className="flex justify-between gap-4 text-orange-700">
              <span>Other Stock Decrease:</span>
              <span className="font-bold">
                -{formatQty(point.adjustment_outflow)} {unit}
              </span>
            </div>
          )}

          <div className="flex justify-between gap-4 text-blue-800 border-t border-slate-100 pt-1">
            <span>Remaining Warehouse Stock:</span>
            <span className="font-bold">
              {formatQty(point.remaining_stock)} {unit}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Current stock summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-white p-3.5 border border-slate-200 rounded">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Physical Warehouse Stock
          </span>
          <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
            {formatQty(asNumber(stock?.on_hand_stock))}{' '}
            <span className="text-xs font-normal text-slate-500">{unit}</span>
          </span>
          <span className="text-[11px] text-slate-500 block">Total physical count</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
            Reserved for Production
          </span>
          <span className="font-mono text-lg font-bold text-amber-700 tabular-nums">
            {formatQty(asNumber(stock?.reserved_stock))}{' '}
            <span className="text-xs font-normal text-slate-500">{unit}</span>
          </span>
          <span className="text-[11px] text-slate-500 block">Locked by scheduled runs</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
            Net Available Stock
          </span>
          <span className="font-mono text-lg font-bold text-blue-700 tabular-nums">
            {formatQty(
              stock?.available_stock !== undefined
                ? asNumber(stock.available_stock)
                : asNumber(stock?.on_hand_stock) - asNumber(stock?.reserved_stock)
            )}{' '}
            <span className="text-xs font-normal text-slate-500">{unit}</span>
          </span>
          <span className="text-[11px] text-slate-500 block">Physical − Reserved</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Safety Reorder Threshold
          </span>
          <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
            {formatQty(asNumber(stock?.min_stock_threshold))}{' '}
            <span className="text-xs font-normal text-slate-500">{unit}</span>
          </span>
          <span className="text-[11px] text-slate-500 block">Minimum buffer level</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Inventory Valuation
          </span>
          <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
            ₹{asNumber(stock?.total_valuation_inr).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </span>
          <span className="text-[11px] text-slate-500 block">
            @ ₹{asNumber(stock?.cost_per_unit).toFixed(2)} / {unit}
          </span>
        </div>
      </div>

      {/* Stock movement graph */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Graph 3: Raw Material Stock Movement
            </h3>
            <span className="text-xs text-slate-500">
              Material:{' '}
              <strong className="text-slate-800">
                {material?.material_name || stock?.material_name || 'Selected Ingredient'}
              </strong>{' '}
              (ID #{material?.id ?? data.material_id ?? '—'})
            </span>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 25, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  minTickGap={12}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(value) =>
                    value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
                  }
                  domain={[0, 'auto']}
                  allowDecimals
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                />

                <Line
                  name="Stock Inflow"
                  type="linear"
                  dataKey="procurement_qty"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ r: 5, fill: '#16a34a', stroke: '#ffffff', strokeWidth: 1.5 }}
                  activeDot={{ r: 7, fill: '#16a34a', stroke: '#ffffff', strokeWidth: 2 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />

                <Line
                  name="Total Stock Outflow"
                  type="linear"
                  dataKey="total_outflow"
                  stroke="#e11d48"
                  strokeWidth={2}
                  dot={{ r: 5, fill: '#e11d48', stroke: '#ffffff', strokeWidth: 1.5 }}
                  activeDot={{ r: 7, fill: '#e11d48', stroke: '#ffffff', strokeWidth: 2 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />

                <Line
                  name="Remaining Warehouse Stock"
                  type="linear"
                  dataKey="remaining_stock"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 1.5 }}
                  activeDot={{ r: 7, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded border border-slate-200 text-center p-4">
            <Package className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-xs font-semibold text-slate-700">
              No Stock Movements in Selected Date Range
            </span>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
              Adjust the date boundaries above or record a stock adjustment to visualize inventory movements.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
