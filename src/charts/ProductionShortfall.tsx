import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ProductionShortfallResponse } from '../types';

interface Props {
  data: ProductionShortfallResponse | null;
  loading: boolean;
}

export const ProductionShortfall: React.FC<Props> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="h-80 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded p-6">
        <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
          Analyzing Production Variance & Shortfalls...
        </span>
      </div>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded p-6 text-center">
        <span className="text-sm font-semibold text-slate-700">No Production Data Available</span>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          No records match the active product filter and date boundaries. Adjust the filters above.
        </p>
      </div>
    );
  }

  const { summary, data: points, selected_product } = data;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      const variance = p.variance !== undefined ? p.variance : (p.actual_qty - p.planned_qty);
      const isShortfall = variance < 0;
      const isSurplus = variance > 0;

      return (
        <div className="bg-white p-3 border border-slate-300 rounded shadow-md text-xs font-mono">
          <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1.5 flex items-center justify-between gap-4">
            <span>Date: {label}</span>
            <span className="text-[10px] text-slate-500 font-normal">
              {selected_product ? selected_product.display_name : 'All Products Aggregated'}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4 text-slate-600">
              <span>Scheduled Target:</span>
              <span className="font-semibold text-slate-800">{p.planned_qty.toLocaleString()} pkts</span>
            </div>
            <div className="flex justify-between gap-4 text-blue-800">
              <span>Actual Output:</span>
              <span className="font-bold text-blue-900">{p.actual_qty.toLocaleString()} pkts</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-100 pt-1 font-bold">
              <span>Variance (Actual − Planned):</span>
              <span className={isSurplus ? 'text-emerald-700' : isShortfall ? 'text-rose-700' : 'text-slate-800'}>
                {variance > 0 ? `+${variance.toLocaleString()}` : variance.toLocaleString()} pkts
                {' '}({isSurplus ? 'Surplus' : isShortfall ? 'Shortfall' : 'Exact'})
              </span>
            </div>
            {p.shortfall > 0 && (
              <div className="flex justify-between gap-4 text-rose-700">
                <span>Shortfall:</span>
                <span className="font-semibold">-{p.shortfall.toLocaleString()} pkts ({p.shortfall_pct.toFixed(1)}%)</span>
              </div>
            )}
            {p.surplus > 0 && (
              <div className="flex justify-between gap-4 text-emerald-700">
                <span>Surplus:</span>
                <span className="font-semibold">+{p.surplus.toLocaleString()} pkts</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const netVariance = summary.net_variance !== undefined ? summary.net_variance : (summary.total_actual - (summary.total_planned || 0));

  return (
    <div className="flex flex-col gap-4">
      {/* Supporting KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-white p-3.5 border border-slate-200 rounded">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Actual Packout
          </span>
          <span className="font-mono text-lg font-bold text-blue-700 tabular-nums">
            {summary.total_actual.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block">Packets fulfilled</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">
            Cumulative Shortfall
          </span>
          <span className="font-mono text-lg font-bold text-rose-700 tabular-nums">
            {summary.total_shortfall.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block">Unfulfilled target packets</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
            Cumulative Surplus
          </span>
          <span className="font-mono text-lg font-bold text-emerald-700 tabular-nums">
            {(summary.total_surplus || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block">Packets above target</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Net Production Variance
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-lg font-bold tabular-nums ${netVariance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {netVariance >= 0 ? `+${netVariance.toLocaleString()}` : netVariance.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              ({netVariance >= 0 ? 'Net Surplus' : 'Net Deficit'})
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">Actual − Planned volume</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Variance Breakdown
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs font-bold text-slate-900">
              {summary.days_with_shortfall} Shortfall / {summary.days_with_surplus || 0} Surplus
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            Peak deficit: {summary.peak_shortfall.toLocaleString()} pkts ({summary.peak_shortfall_date || 'N/A'})
          </span>
        </div>
      </div>

      {/* Grouped Bar Chart Showing Actual, Shortfall, and Surplus */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Graph 2: Actual Output vs Production Variance (Shortfall &amp; Surplus)
            </h3>
            <p className="text-xs text-slate-500">
              Variance = Actual Output − Planned Target. Negative indicates Shortfall; Positive indicates Surplus.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-2xs"></span>
              <span className="font-semibold text-blue-900">Actual Output</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-rose-600 rounded-2xs"></span>
              <span className="font-semibold text-rose-800">Shortfall</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-2xs"></span>
              <span className="font-semibold text-emerald-800">Surplus</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 10, right: 25, left: 10, bottom: 10 }}>
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
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                tickLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <Bar name="Actual Output" dataKey="actual_qty" fill="#2563eb" radius={[3, 3, 0, 0]} maxBarSize={30} />
              <Bar name="Target Shortfall" dataKey="shortfall" fill="#dc2626" radius={[3, 3, 0, 0]} maxBarSize={30} />
              <Bar name="Production Surplus" dataKey="surplus" fill="#16a34a" radius={[3, 3, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
