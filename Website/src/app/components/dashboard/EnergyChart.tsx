'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const ENERGY_DATA = [
  { time: '00:00', power: 320 },
  { time: '01:00', power: 280 },
  { time: '02:00', power: 250 },
  { time: '03:00', power: 230 },
  { time: '04:00', power: 220 },
  { time: '05:00', power: 260 },
  { time: '06:00', power: 380 },
  { time: '07:00', power: 520 },
  { time: '08:00', power: 680 },
  { time: '09:00', power: 750 },
  { time: '10:00', power: 820 },
  { time: '11:00', power: 900 },
  { time: '12:00', power: 1050 },
  { time: '13:00', power: 980 },
  { time: '14:00', power: 1100 },
  { time: '15:00', power: 1020 },
  { time: '16:00', power: 890 },
  { time: '17:00', power: 780 },
  { time: '18:00', power: 920 },
  { time: '19:00', power: 1080 },
  { time: '20:00', power: 950 },
  { time: '21:00', power: 720 },
  { time: '22:00', power: 520 },
  { time: '23:00', power: 380 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="energy-tooltip">
      <p className="energy-tooltip__time">{label}</p>
      <p className="energy-tooltip__value">{payload[0].value.toFixed(1)}W</p>
    </div>
  );
}

export default function EnergyChart() {
  return (
    <div className="energy-chart" id="energy-chart">
      <h3 className="energy-chart__title">
        ⚡ Xu Hướng Điện Năng (24h)
      </h3>
      <div className="energy-chart__container">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={ENERGY_DATA} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={45}
              tickFormatter={(v: number) => `${v}W`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="power"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#powerGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#3b82f6',
                stroke: '#0d121f',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
