'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getDevicePower, getRoomPower } from '../../store';
import type { RoomData } from '../../types';

/* ──────────────────── Color Palette ──────────────────── */
const PALETTE = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#14b8a6', // teal
];

/* ──────────────────── Props ──────────────────── */
interface PowerAnalyticsProps {
  rooms: RoomData[];
}

/* ──────────────────── Pie Custom Label ──────────────────── */
interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
}

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: LabelProps) {
  if (percent < 0.03) return null; // skip tiny slices
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

/* ──────────────────── Custom Tooltips ──────────────────── */
interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}

function PieCustomTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="power-analytics__tooltip">
      <div className="power-analytics__tooltip-dot" style={{ background: item.payload.fill }} />
      <span className="power-analytics__tooltip-name">{item.name}</span>
      <span className="power-analytics__tooltip-value">{item.value.toFixed(1)}W</span>
    </div>
  );
}

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { name: string; room: string; fill: string } }>;
}

function BarCustomTooltip({ active, payload }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="power-analytics__tooltip">
      <div className="power-analytics__tooltip-dot" style={{ background: item.payload.fill }} />
      <div className="power-analytics__tooltip-info">
        <span className="power-analytics__tooltip-name">{item.payload.name}</span>
        <span className="power-analytics__tooltip-sub">{item.payload.room}</span>
      </div>
      <span className="power-analytics__tooltip-value">{item.value.toFixed(1)}W</span>
    </div>
  );
}

/* ──────────────────── Legend ──────────────────── */
interface CustomLegendProps {
  payload?: Array<{ value: string; color: string }>;
}

function CustomPieLegend({ payload }: CustomLegendProps) {
  if (!payload) return null;
  return (
    <div className="power-analytics__legend">
      {payload.map((entry, idx) => (
        <div key={idx} className="power-analytics__legend-item">
          <div className="power-analytics__legend-dot" style={{ background: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function PowerAnalytics({ rooms }: PowerAnalyticsProps) {
  /* ── Pie data: power per room ── */
  const pieData = useMemo(() => {
    return rooms
      .map((room, i) => ({
        name: room.name,
        value: getRoomPower(room),
        fill: PALETTE[i % PALETTE.length],
      }))
      .filter((d) => d.value > 0);
  }, [rooms]);

  /* ── Bar data: active devices ── */
  const barData = useMemo(() => {
    const items: { name: string; power: number; room: string; fill: string }[] = [];
    rooms.forEach((room, ri) => {
      room.devices.forEach((device) => {
        if (device.status) {
          items.push({
            name: device.name,
            power: getDevicePower(device),
            room: room.name,
            fill: PALETTE[ri % PALETTE.length],
          });
        }
      });
    });
    return items.sort((a, b) => b.power - a.power);
  }, [rooms]);

  const hasData = pieData.length > 0;

  return (
    <div className="power-analytics" id="power-analytics">
      {/* ───── Pie Chart Card ───── */}
      <div className="power-analytics__card" id="power-pie-chart">
        <h3 className="power-analytics__title">
          🥧 Tỷ Lệ Điện Năng Theo Phòng
        </h3>
        {hasData ? (
          <div className="power-analytics__chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      stroke="rgba(0,0,0,0.3)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieCustomTooltip />} />
                <Legend content={<CustomPieLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="power-analytics__empty">
            <span>Chưa có dữ liệu — hãy bật thiết bị</span>
          </div>
        )}
      </div>

      {/* ───── Bar Chart Card ───── */}
      <div className="power-analytics__card" id="power-bar-chart">
        <h3 className="power-analytics__title">
          📊 Công Suất Thiết Bị Đang Bật
        </h3>
        {barData.length > 0 ? (
          <div className="power-analytics__chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={barData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                barCategoryGap="20%"
              >
                <defs>
                  {barData.map((entry, index) => (
                    <linearGradient
                      key={`barGrad-${index}`}
                      id={`barGrad-${index}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={entry.fill} stopOpacity={1} />
                      <stop offset="100%" stopColor={entry.fill} stopOpacity={0.4} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  tickFormatter={(v: number) => `${v}W`}
                />
                <Tooltip
                  content={<BarCustomTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar
                  dataKey="power"
                  radius={[6, 6, 0, 0]}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {barData.map((_, index) => (
                    <Cell key={`bar-${index}`} fill={`url(#barGrad-${index})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="power-analytics__empty">
            <span>Không có thiết bị nào đang bật</span>
          </div>
        )}
      </div>
    </div>
  );
}
