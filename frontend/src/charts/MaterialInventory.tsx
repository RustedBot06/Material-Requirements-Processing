
import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { MaterialInventoryResponse } from '../types';
import { Package } from 'lucide-react';

interface MaterialInventoryProps {
  data: MaterialInventoryResponse | null;
  loading: boolean;
}

const MaterialInventory: React.FC<MaterialInventoryProps> = ({
  data,
  loading,
}) => {
  const [showInflow, setShowInflow] = useState(true);
  const [showOutflow, setShowOutflow] = useState(true);
  const [showStock, setShowStock] = useState(true);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading inventory data...
      </div>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Package size={40} className="mb-3 opacity-50" />
        <p>No stock movement data available for this period.</p>
      </div>
    );
  }

  const points = data.data;

  const chartData = points.map((p) => {
    const inflow = Number(p.procurement_qty || 0);
    const productionOutflow = Number(p.consumption_qty || 0);
    const manualOutflow = Number(p.adjustment_outflow || 0);

    const totalOutflow = Math.abs(
      productionOutflow + manualOutflow
    );

    const closingStock = Number(p.remaining_stock || 0);
    const backendOpening = Number(p.opening_balance_qty || 0);

    const openingStock =
      backendOpening > 0 || Number(p.movement_count || 0) === 0
        ? backendOpening
        : closingStock - inflow + totalOutflow;

    return {
      ...p,
      procurement_qty: inflow,
      consumption_qty: productionOutflow,
      adjustment_outflow: manualOutflow,
      total_outflow: totalOutflow,
      remaining_stock: closingStock,
      opening_balance_qty: openingStock,
    };
  });

  console.log("Material Inventory Chart Data:", chartData);
  console.error("CHART DATA CHECK:", chartData);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const point = payload[0].payload;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold mb-2">{label}</p>

        {Number(point.movement_count || 0) > 0 && (
          <p className="text-gray-600">
            Opening Balance:{' '}
            {point.opening_balance_qty.toFixed(2)} {data.selected_material?.unit}
          </p>
        )}

        <p className="text-green-600">
          Stock Inflow: +{point.procurement_qty.toFixed(2)}
        </p>

        <p className="text-red-600">
          Production Consumption: -{point.consumption_qty.toFixed(2)}
        </p>

        <p className="text-red-600">
          Manual Decrease: -{point.adjustment_outflow.toFixed(2)}
        </p>

        <p className="font-medium text-red-700">
          Total Outflow: {point.total_outflow.toFixed(2)}
        </p>

        <div className="border-t border-gray-200 mt-2 pt-2">
          <p className="font-semibold text-blue-600">
            Closing Physical Stock:{' '}
            {point.remaining_stock.toFixed(2)}{' '}
            {data.selected_material?.unit}
          </p>
        </div>
      </div>
    );
  };

  const summary = data.summary;
  const unit = data.selected_material?.unit || '';

  return (
    <div className="space-y-5">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">Total Procurement</p>
          <p className="text-2xl font-bold text-green-800">
            {Number(summary?.total_procurement_inflow || 0).toFixed(2)}
          </p>
          <p className="text-xs text-green-600">{unit}</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">Total Outflow</p>
          <p className="text-2xl font-bold text-red-800">
            {(
              Number(summary?.total_consumption_outflow || 0) +
              Number(summary?.total_adjustment_outflow || 0)
            ).toFixed(2)}
          </p>
          <p className="text-xs text-red-600">{unit}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">Current Stock</p>
          <p className="text-2xl font-bold text-blue-800">
            {Number(data.current_stock_summary?.on_hand_stock || 0).toFixed(2)}
          </p>
          <p className="text-xs text-blue-600">{unit}</p>
        </div>

      </div>

      {/* Chart Controls */}
      <div className="flex flex-wrap gap-4 text-sm">

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showInflow}
            onChange={(e) => setShowInflow(e.target.checked)}
          />
          <span className="text-green-700 font-medium">Stock Inflow</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOutflow}
            onChange={(e) => setShowOutflow(e.target.checked)}
          />
          <span className="text-red-700 font-medium">Stock Outflow</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showStock}
            onChange={(e) => setShowStock(e.target.checked)}
          />
          <span className="text-blue-700 font-medium">Physical Stock</span>
        </label>

      </div>

      {/* Inventory Chart */}
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
            />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />

            <YAxis
              domain={[0, 'auto']}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => Number(value).toFixed(0)}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend />

            {showInflow && (
              <Line
                name="Stock Inflow"
                type="linear"
                dataKey="procurement_qty"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 5, fill: '#16a34a' }}
                activeDot={{ r: 7 }}
                isAnimationActive={false}
              />
            )}

            {showOutflow && (
              <Line
                name="Stock Outflow"
                type="linear"
                dataKey="total_outflow"
                stroke="#dc2626"
                strokeWidth={0}
                dot={(props: any) => {
                if (props.cx == null || props.cy == null) return null;

              return (
              <circle
              cx={props.cx}
              cy={props.cy}
              r={8}
              fill="#dc2626"
              stroke="white"
              strokeWidth={2}
             />
            );
            }}
    activeDot={{ r: 10, fill: '#dc2626' }}
    isAnimationActive={false}
  />
)}

            {showStock && (
              <Line
                name="Physical Stock After Movements"
                type="linear"
                dataKey="remaining_stock"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 5, fill: '#2563eb' }}
                activeDot={{ r: 7 }}
                isAnimationActive={false}
              />
            )}

          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default MaterialInventory;