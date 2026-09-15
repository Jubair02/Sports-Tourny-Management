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

const DISTRICT_COLORS = ["#10b981", "#f59e0b", "#0ea5e9", "#8b5cf6", "#f43f5e", "#14b8a6", "#fb923c", "#06b6d4"];

export function ReportsCharts({
  kind,
  data,
}: {
  kind: "sport" | "status" | "district";
  data: { name: string; count?: number; value?: number; color?: string }[];
}) {
  if (data.length === 0) {
    return <EmptyState title="No data" description="No data available for this chart." />;
  }

  if (kind === "status") {
    const pieData = data.map((d) => ({ name: d.name, value: d.value ?? 0, color: d.color ?? "secondary" }));
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {pieData.map((entry, i) => (
                <Cell key={i} fill={STATUS_HEX[entry.color] ?? "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const chartData = data.map((d) => ({ name: d.name, count: d.count ?? d.value ?? 0 }));
  // Sports have named colors (fall back to the palette); districts just cycle the palette.
  const barColor = (name: string, i: number): string =>
    (kind === "sport" ? SPORT_COLORS[name] : undefined) ??
    DISTRICT_COLORS[i % DISTRICT_COLORS.length] ??
    "#10b981";

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
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
            {chartData.map((entry, i) => (
              <Cell key={i} fill={barColor(entry.name, i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
