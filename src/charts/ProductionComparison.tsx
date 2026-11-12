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
import { ProductionComparisonResponse } from '../types';

interface Props {
  data: ProductionComparisonResponse | null;
  loading: boolean;
}

export const ProductionComparison: React.FC<Props> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="h-80 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded p-6">
        <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
          Aggregating Planned vs Actual Output...
        </span>
      </div>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded p-6 text-center">
        <span className="text-sm font-semibold text-slate-700">No Production Records in Selected Window</span>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Adjust the product filter or date range above to visualize planned line targets vs packout dispatch.
        </p>
      </div>
    );
  }

  const { summary, data: points, selected_product } = data;
  const isPositiveVariance = summary.net_variance >= 0;

  // Format tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
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
              <span>Target (Planned):</span>
              <span className="font-semibold text-slate-800">{p.planned_qty.toLocaleString()} pkts</span>
            </div>
            <div className="flex justify-between gap-4 text-blue-700">
              <span>Output (Actual):</span>
              <span className="font-bold text-blue-900">{p.actual_qty.toLocaleString()} pkts</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-100 pt-1">
              <span>Daily Variance:</span>
              <span className={`font-bold ${p.variance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {p.variance >= 0 ? `+${p.variance.toLocaleString()}` : p.variance.toLocaleString()} pkts
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Achievement:</span>
              <span className="font-bold text-slate-900">{p.achievement_pct.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Supporting Metric Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3.5 border border-slate-200 rounded">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Planned Target
          </span>
          <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
            {summary.total_planned.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block">Scheduled packets</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Actual Output
          </span>
          <span className="font-mono text-lg font-bold text-blue-700 tabular-nums">
            {summary.total_actual.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block">Dispatched finished goods</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Net Production Variance
          </span>
          <span
            className={`font-mono text-lg font-bold tabular-nums ${
              isPositiveVariance ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {isPositiveVariance ? `+${summary.net_variance.toLocaleString()}` : summary.net_variance.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block">
            {isPositiveVariance ? 'Output exceeded target' : 'Unfulfilled scheduled units'}
          </span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Overall Achievement
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
              {summary.overall_achievement_pct.toFixed(1)}%
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              ({summary.record_count} production days)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                summary.overall_achievement_pct >= 95 ? 'bg-emerald-600' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, summary.overall_achievement_pct)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Line Chart */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Graph 1: Planned Target vs Actual Packout Output
            </h3>
            <span className="text-xs text-slate-500">
              Daily comparative curve across active scheduling window
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-500"></span>
              <span className="text-slate-600">Planned Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-600"></span>
              <span className="font-semibold text-blue-900">Actual Output</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 10, right: 25, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                tickLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                tickLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <Line
                name="Planned Target"
                type="monotone"
                dataKey="planned_qty"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#64748b' }}
                activeDot={{ r: 5 }}
              />
              <Line
                name="Actual Output"
                type="monotone"
                dataKey="actual_qty"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
