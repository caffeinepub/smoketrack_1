import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart2,
  Calculator,
  Flame,
  Lightbulb,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SmokingLog, UserSettings } from "../hooks/useQueries";
import { computeStats } from "../hooks/useQueries";

interface InsightsProps {
  logs: SmokingLog[];
  settings: UserSettings;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-xl px-3 py-2.5 text-xs shadow-xl">
        <p className="text-muted-foreground mb-1">{label}</p>
        <p className="text-foreground font-bold">
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

function AnimatedBar({
  value,
  max,
  color,
}: { value: number; max: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(
      () => setWidth(max > 0 ? (value / max) * 100 : 0),
      100,
    );
    return () => clearTimeout(t);
  }, [value, max]);
  return (
    <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full progress-bar ${color}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

const SAVINGS_ITEMS = [
  { label: "cups of coffee", valuePerUnit: 60 },
  { label: "restaurant meals", valuePerUnit: 400 },
  { label: "movie tickets", valuePerUnit: 250 },
  { label: "books", valuePerUnit: 300 },
];

export function Insights({ logs, settings }: InsightsProps) {
  const stats = computeStats(logs, settings);
  const [reduceBy, setReduceBy] = useState(2);

  const now = new Date();
  const currentMonth = now.getMonth();
  const monthCigs = logs
    .filter((l) => {
      const d = new Date(l.date);
      return (
        d.getMonth() === currentMonth && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((s, l) => s + Number(l.cigarettesCount), 0);

  // 30-day weekly aggregates
  const dailyMap = new Map<string, { cigs: number; spent: number }>();
  for (const log of logs) {
    const existing = dailyMap.get(log.date) ?? { cigs: 0, spent: 0 };
    dailyMap.set(log.date, {
      cigs: existing.cigs + Number(log.cigarettesCount),
      spent: existing.spent + log.totalSpent,
    });
  }

  const last30Data = Array.from({ length: 4 }, (_, weekIdx) => {
    let cigs = 0;
    let spent = 0;
    for (let d = 0; d < 7; d++) {
      const dayOffset = (3 - weekIdx) * 7 + (6 - d);
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split("T")[0];
      const entry = dailyMap.get(dateStr);
      if (entry) {
        cigs += entry.cigs;
        spent += entry.spent;
      }
    }
    return { label: `Wk ${weekIdx + 1}`, cigs, spent };
  });

  const yearly = stats.yearlyProjection;

  // Weekly report
  const WEEK_DAYS_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const thisWeek = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    const dayOfWeek = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
    const target = new Date(monday);
    target.setDate(monday.getDate() + i);
    const dateStr = target.toISOString().split("T")[0];
    const entry = dailyMap.get(dateStr) ?? { cigs: 0, spent: 0 };
    return { label: WEEK_DAYS_FULL[i], dateStr, ...entry };
  });
  const lastWeek = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    const dayOfWeek = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7) - 7);
    const target = new Date(monday);
    target.setDate(monday.getDate() + i);
    const dateStr = target.toISOString().split("T")[0];
    const entry = dailyMap.get(dateStr) ?? { cigs: 0, spent: 0 };
    return { label: WEEK_DAYS_FULL[i], dateStr, ...entry };
  });
  const thisWeekTotal = thisWeek.reduce((s, d) => s + d.cigs, 0);
  const lastWeekTotal = lastWeek.reduce((s, d) => s + d.cigs, 0);
  const worstDay = thisWeek.reduce(
    (worst, d) => (d.cigs >= worst.cigs ? d : worst),
    thisWeek[0],
  );

  // Calculator
  const savingsPerDay = reduceBy * settings.pricePerCigarette;
  const savingsPerWeek = savingsPerDay * 7;
  const savingsPerMonth = savingsPerDay * 30;
  const savingsPerYear = savingsPerDay * 365;

  const barRadiusFull: [number, number, number, number] = [4, 4, 0, 0];

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="pt-2">
        <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
          Analytics
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground leading-tight">
          Insights
        </h1>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full bg-muted/40 border border-border h-10 rounded-xl p-0.5">
          <TabsTrigger
            value="overview"
            className="flex-1 h-full rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            data-ocid="insights.overview.tab"
          >
            <BarChart2 className="w-3.5 h-3.5 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="weekly"
            className="flex-1 h-full rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            data-ocid="insights.weekly.tab"
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
            Weekly
          </TabsTrigger>
          <TabsTrigger
            value="calculator"
            className="flex-1 h-full rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            data-ocid="insights.calculator.tab"
          >
            <Calculator className="w-3.5 h-3.5 mr-1.5" />
            Savings
          </TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
          {/* Key stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: <Flame className="w-4 h-4 text-secondary" />,
                label: "This month",
                value: `₹${stats.monthSpent.toFixed(0)}`,
                sub: `${monthCigs} cigs`,
              },
              {
                icon: <TrendingDown className="w-4 h-4 text-primary" />,
                label: "Per year",
                value: `₹${yearly.toFixed(0)}`,
                sub: "projected",
              },
              {
                icon: <Target className="w-4 h-4 text-success" />,
                label: "Save (2/day)",
                value: `₹${stats.savingsIf2Less.toFixed(0)}`,
                sub: "per month",
              },
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                className="surface-card rounded-xl p-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: idx * 0.05,
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
              >
                {item.icon}
                <p className="font-display text-lg font-bold text-foreground leading-none mt-2">
                  {item.value}
                </p>
                <p className="text-muted-foreground text-[10px] mt-0.5">
                  {item.label}
                </p>
                <p className="text-muted-foreground text-[10px]">{item.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Daily usage chart */}
          <motion.div
            className="surface-card rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.1,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-foreground text-sm font-medium">
                Daily Usage — Last 7 Days
              </p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart
                  data={stats.last7}
                  margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(100% 0 0 / 0.05)"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "oklch(55% 0.02 265)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "oklch(55% 0.02 265)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="cigs"
                    name="Cigs"
                    fill="oklch(62% 0.18 265)"
                    radius={barRadiusFull}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Spending line chart */}
          <motion.div
            className="surface-card rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.15,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <div className="px-4 py-3 border-b border-border">
              <p className="text-foreground text-sm font-medium">
                Spending (₹) — Last 7 Days
              </p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart
                  data={stats.last7}
                  margin={{ top: 4, right: 0, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="oklch(78% 0.14 65)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="oklch(78% 0.14 65)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(100% 0 0 / 0.05)"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "oklch(55% 0.02 265)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "oklch(55% 0.02 265)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="spent"
                    name="₹ Spent"
                    stroke="oklch(78% 0.14 65)"
                    strokeWidth={2}
                    fill="url(#spendGrad)"
                    dot={{ r: 3, fill: "oklch(78% 0.14 65)", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Future shock */}
          <motion.div
            className="glass-card rounded-2xl p-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-secondary" />
              <p className="text-sm font-semibold text-foreground">
                At your current rate
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: "1 Year", value: yearly, pct: 20 },
                { label: "5 Years", value: yearly * 5, pct: 55 },
                { label: "10 Years", value: yearly * 10, pct: 100 },
              ].map(({ label, value, pct }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-foreground font-bold">
                      ₹{value.toFixed(0)}
                    </span>
                  </div>
                  <AnimatedBar
                    value={pct}
                    max={100}
                    color={
                      pct < 50
                        ? "bg-primary"
                        : pct < 80
                          ? "bg-secondary"
                          : "bg-destructive"
                    }
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* ── WEEKLY TAB ── */}
        <TabsContent value="weekly" className="mt-4 flex flex-col gap-4">
          {/* This vs last week comparison */}
          <motion.div
            className="surface-card rounded-2xl p-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <p className="text-sm font-medium text-foreground mb-3">
              This Week vs Last Week
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center p-3 rounded-xl bg-primary/10 border border-primary/20">
                <p className="font-display text-3xl font-bold text-primary">
                  {thisWeekTotal}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  This week
                </p>
              </div>
              <div className="text-muted-foreground">
                {thisWeekTotal < lastWeekTotal ? (
                  <TrendingDown className="w-5 h-5 text-success" />
                ) : thisWeekTotal > lastWeekTotal ? (
                  <TrendingUp className="w-5 h-5 text-destructive" />
                ) : (
                  <span className="text-xs">—</span>
                )}
              </div>
              <div className="flex-1 text-center p-3 rounded-xl bg-muted/30 border border-border">
                <p className="font-display text-3xl font-bold text-muted-foreground">
                  {lastWeekTotal}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Last week
                </p>
              </div>
            </div>
          </motion.div>

          {/* Day-by-day grid */}
          <motion.div
            className="surface-card rounded-2xl p-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.06,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <p className="text-sm font-medium text-foreground mb-3">
              This Week
            </p>
            <div className="flex flex-col gap-2">
              {thisWeek.map((day, idx) => {
                const isWorst = worstDay.label === day.label && day.cigs > 0;
                return (
                  <div
                    key={day.label}
                    className="flex items-center gap-3"
                    data-ocid={`insights.item.${idx + 1}`}
                  >
                    <span className="w-8 text-muted-foreground text-xs font-medium">
                      {day.label}
                    </span>
                    <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full progress-bar ${
                          day.cigs === 0 ? "bg-transparent" : "bg-primary"
                        }`}
                        style={{
                          width: `${
                            thisWeekTotal > 0
                              ? (
                                  day.cigs /
                                    Math.max(...thisWeek.map((d) => d.cigs), 1)
                                ) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-foreground text-xs font-semibold">
                      {day.cigs > 0 ? day.cigs : "—"}
                    </span>
                    <span className="w-14 text-right text-muted-foreground text-xs">
                      {day.spent > 0 ? `₹${day.spent.toFixed(0)}` : ""}
                    </span>
                    {isWorst && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive">
                        most
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* 30-day bar chart */}
          <motion.div
            className="surface-card rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.12,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <div className="px-4 py-3 border-b border-border">
              <p className="text-foreground text-sm font-medium">
                Last 30 Days (weekly)
              </p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart
                  data={last30Data}
                  margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(100% 0 0 / 0.05)"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "oklch(55% 0.02 265)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "oklch(55% 0.02 265)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="cigs"
                    name="Cigs"
                    fill="oklch(62% 0.18 265)"
                    radius={barRadiusFull}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </TabsContent>

        {/* ── CALCULATOR TAB ── */}
        <TabsContent value="calculator" className="mt-4 flex flex-col gap-4">
          <motion.div
            className="surface-card rounded-2xl p-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <p className="text-sm font-semibold text-foreground mb-1">
              Money saved if I reduce by
            </p>
            <div className="flex items-center gap-3 mt-3 mb-2">
              <button
                type="button"
                className="w-8 h-8 rounded-full surface-card flex items-center justify-center bounce-tap"
                onClick={() => setReduceBy((v) => Math.max(1, v - 1))}
              >
                <span className="text-foreground text-lg leading-none">−</span>
              </button>
              <div className="flex-1 text-center">
                <span className="font-display text-4xl font-bold gradient-text">
                  {reduceBy}
                </span>
                <span className="text-muted-foreground text-sm ml-2">
                  per day
                </span>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center bounce-tap"
                onClick={() => setReduceBy((v) => v + 1)}
              >
                <span className="text-primary text-lg leading-none">+</span>
              </button>
            </div>
            <p className="text-muted-foreground text-xs text-center">
              ₹{settings.pricePerCigarette}/cig × {reduceBy} fewer
            </p>
          </motion.div>

          {/* Savings breakdown */}
          <motion.div
            className="surface-card rounded-2xl p-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.06,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <p className="text-sm font-medium text-foreground mb-4">
              You'd save
            </p>
            <div className="flex flex-col gap-3">
              {[
                {
                  label: "Per week",
                  value: savingsPerWeek,
                  color: "text-primary",
                },
                {
                  label: "Per month",
                  value: savingsPerMonth,
                  color: "text-secondary",
                },
                {
                  label: "Per year",
                  value: savingsPerYear,
                  color: "text-success",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <span className="text-muted-foreground text-sm">
                    {item.label}
                  </span>
                  <span
                    className={`font-display text-xl font-bold ${item.color}`}
                  >
                    ₹{item.value.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* What you could buy */}
          <motion.div
            className="glass-card rounded-2xl p-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.12,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <p className="text-sm font-semibold text-foreground mb-4">
              That yearly saving gets you
            </p>
            <div className="flex flex-col gap-3">
              {SAVINGS_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-muted-foreground text-sm">
                    {item.label}
                  </span>
                  <span className="text-foreground text-sm font-semibold">
                    {Math.floor(savingsPerYear / item.valuePerUnit)}×
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center pt-2 pb-2">
        <p className="text-muted-foreground text-xs">
          &copy; {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            Built with love using caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
