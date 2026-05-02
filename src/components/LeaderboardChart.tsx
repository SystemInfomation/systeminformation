"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type LeaderboardRow = { name: string; balance: number; roi: number; wins: number };

export function LeaderboardChart({ data }: { data: LeaderboardRow[] }) {
  return (
    <div className="h-72 w-full rounded-3xl border border-white/10 bg-white/5 p-4 dark:bg-black/20">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,162,39,0.15)" />
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--foreground)", fontSize: 10 }}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fill: "var(--derby-muted)", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "#0d3b2c",
              border: "1px solid rgba(201,162,39,0.35)",
              borderRadius: 12,
              color: "#f5e6c8",
            }}
          />
          <Bar dataKey="balance" fill="#c9a227" radius={[8, 8, 0, 0]} name="Bankroll $" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
