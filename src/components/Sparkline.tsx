import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { HistoryEntry } from '../../types/types';

interface SparklineProps {
  history: HistoryEntry[];
  maxPoints?: number;
  height?: number;
}

// Format large numbers (e.g., 28500000 -> "28.5M")
function formatCompact(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
}

// Format time for X-axis labels
function formatTimeLabel(timestamp: string, firstTimestamp: string): string {
  const date = new Date(timestamp);
  const firstDate = new Date(firstTimestamp);
  const diffMs = date.getTime() - firstDate.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHours === 0) return 'now';
  return `${diffHours}h`;
}

export const Sparkline: React.FC<SparklineProps> = ({
  history,
  maxPoints = 72,
  height = 80,
}) => {
  if (!history || history.length === 0) {
    return <div style={{ color: '#666', fontSize: '12px' }}>No history data</div>;
  }

  // Filter out 0 values (API outages) and downsample if needed
  let displayHistory = history.filter((h) => h.online > 0);

  if (displayHistory.length === 0) {
    return <div style={{ color: '#666', fontSize: '12px' }}>No history data</div>;
  }

  if (displayHistory.length > maxPoints) {
    const step = Math.ceil(displayHistory.length / maxPoints);
    displayHistory = displayHistory.filter((_, i) => i % step === 0);
  }

  // Transform data for recharts
  const chartData = displayHistory.map((h, index) => ({
    online: h.online,
    timestamp: h.timestamp,
    index,
  }));

  // Calculate statistics
  const values = displayHistory.map((h) => h.online);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  // Color based on whether all services are up
  const allUp = history[history.length - 1]?.all_services_up ?? true;
  const lineColor = allUp ? '#4caf50' : '#ff9800';

  // Calculate time span for title
  const intervalMinutes = 10;
  const totalMinutes = history.length * intervalMinutes;
  const hours = Math.floor(totalMinutes / 60);
  const timeLabel = hours >= 1 ? `${hours}h` : `${totalMinutes}m`;

  // Calculate domain with some padding
  const yMin = Math.floor(min * 0.98);
  const yMax = Math.ceil(max * 1.02);

  return (
    <div style={{ fontSize: '11px' }} title={`${history.length} data points over ${timeLabel}`}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.4} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="index"
            axisLine={{ stroke: '#444' }}
            tickLine={{ stroke: '#444' }}
            tick={{ fill: '#888', fontSize: 9 }}
            tickFormatter={(index) => {
              if (index === 0) return `-${timeLabel}`;
              if (index === chartData.length - 1) return 'now';
              return '';
            }}
            ticks={[0, chartData.length - 1]}
          />
          <YAxis
            domain={[yMin, yMax]}
            axisLine={{ stroke: '#444' }}
            tickLine={{ stroke: '#444' }}
            tick={{ fill: '#888', fontSize: 9 }}
            tickFormatter={formatCompact}
            width={35}
            ticks={[min, max]}
          />
          <ReferenceLine
            y={mean}
            stroke="#666"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <Area
            type="monotone"
            dataKey="online"
            stroke={lineColor}
            strokeWidth={2}
            fill="url(#areaGradient)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
