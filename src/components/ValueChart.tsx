import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { HistoricalPoint } from '../types'
import { money } from '../lib/format'

export default function ValueChart({ data, currency, height = 260, up }: { data: HistoricalPoint[]; currency: string; height?: number; up: boolean }) {
  const color = up ? '#34d399' : '#fb7185'
  const id = up ? 'gUp' : 'gDown'
  if (data.length < 2) {
    return (
      <div style={{ height }} className="flex items-center justify-center rounded-lg border border-dashed border-line text-sm text-zinc-600">
        Chart appears once there are two or more valuations.
      </div>
    )
  }
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e1e24" vertical={false} />
          <XAxis dataKey="date" stroke="#52525b" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={40} />
          <YAxis
            orientation="right"
            stroke="#52525b"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={64}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => money(v, currency, true)}
          />
          <Tooltip
            contentStyle={{ background: '#09090b', border: '1px solid #232329', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#a1a1aa' }}
            formatter={(v) => [money(Number(v), currency), 'Value']}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
