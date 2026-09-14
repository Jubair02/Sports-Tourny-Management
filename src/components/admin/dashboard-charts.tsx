"use client";

import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { EmptyState } from "@/components/shared/page-elements";

const SPORT_COLORS: Record<string, string> = {
  Football: "#10b981",
  Cricket: "#f59e0b",
  Futsal: "#14b8a6",
  Badminton: "#f43f5e",
  Basketball: "#fb923c",
  Volleyball: "#06b6d4",
  "Table Tennis": "#8b5cf6",
  Esports: "#d946ef",
};

const STATUS_HEX: Record<string, string> = {
  emerald: "#10b981",
  amber: "#f59e0b",
  blue: "#0ea5e9",
  destructive: "#ef4444",
  secondary: "#94a3b8",
  rose: "#f43f5e",
  teal: "#14b8a6",
  orange: "#fb923c",
  cyan: "#06b6d4",
  violet: "#8b5cf6",
  fuchsia: "#d946ef",
};

export function SportBarChart({ data }: { data: { name: string; count: number }[] }) {
  if (data.length === 0) {
    return <EmptyState title="No tournaments" description="No tournament data yet." />;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={50}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={SPORT_COLORS[entry.name] ?? "#10b981"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusDonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  if (data.length === 0) {
    return <EmptyState title="No data" description="Tournament statuses will appear here." />;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {data.map((entry, i) => (
              <Cell key={i} fill={STATUS_HEX[entry.color] ?? "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
