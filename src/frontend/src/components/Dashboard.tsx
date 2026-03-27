import { Progress } from "@/components/ui/progress";
import {
  BarChart2,
  Calendar,
  Cigarette,
  Flame,
  Heart,
  PiggyBank,
  Plus,
  Settings2,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useCountUp } from "../hooks/useCountUp";
import type { SmokingLog, UserSettings } from "../hooks/useQueries";
import { computeStats } from "../hooks/useQueries";

interface DashboardProps {
  logs: SmokingLog[];
  settings: UserSettings;
  onAddCigarette: () => void;
  isLoading: boolean;
  onOpenSettings: () => void;
}

function formatCurrency(amount: number) {
  return `₹${amount.toFixed(0)}`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const INSIGHTS = [
  (amt: number) => `You've burned ₹${amt.toFixed(0)} this month on cigarettes`,
  (amt: number) =>
    `₹${amt.toFixed(0)} spent this month — that's a weekend trip`,
  (amt: number) =>
    `At this rate, you'll spend ₹${(amt * 12).toFixed(0)} this year`,
  (amt: number) => `₹${(amt / 30).toFixed(0)} per day — small cuts add up fast`,
];

function getInsightText(monthSpent: number, idx: number): string {
  if (monthSpent < 50) return "Start tracking — awareness is the first step.";
  const fn = INSIGHTS[idx % INSIGHTS.length];
  return fn(monthSpent);
}

function AnimatedProgressBar({
  value,
  color,
}: { value: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 80);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full progress-bar ${color}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// Health milestones
const MILESTONES = [
  { label: "20 min", ms: 20 * 60 * 1000, desc: "BP normalizes" },
  { label: "8 hr", ms: 8 * 60 * 60 * 1000, desc: "CO drops" },
  { label: "48 hr", ms: 48 * 60 * 60 * 1000, desc: "Smell & taste" },
  { label: "2 wks", ms: 14 * 24 * 60 * 60 * 1000, desc: "Circulation" },
  { label: "1 yr", ms: 365 * 24 * 60 * 60 * 1000, desc: "Heart risk −50%" },
];

function formatTimeSince(ms: number): string {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const mins = Math.floor((ms % (60 * 60 * 1000)) / 60000);
  if (hours === 0) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ${mins}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h ago`;
}

// Savings Goal Ring
function SavingsGoalRing({ spent, goal }: { spent: number; goal: number }) {
  const pct = Math.min(100, (spent / goal) * 100);
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;
  // Gold -> warning -> destructive based on budget usage
  const ringColor =
    pct < 80
      ? "oklch(77% 0.09 78)"
      : pct < 100
        ? "oklch(75% 0.13 65)"
        : "oklch(55% 0.22 25)";
  const remaining = Math.max(0, goal - spent);

  return (
    <motion.div
      className="surface-card rounded-2xl p-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28, type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            role="img"
            aria-label="Savings goal progress ring"
          >
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="oklch(100% 0 0 / 0.06)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={dash}
              transform="rotate(-90 50 50)"
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-sm font-bold text-foreground leading-none">
              ₹{spent.toFixed(0)}
            </span>
            <span className="text-muted-foreground text-[10px] mt-0.5">
              spent
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm font-semibold leading-snug">
            Monthly Budget
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            of ₹{goal.toFixed(0)} goal
          </p>
          {remaining > 0 ? (
            <p
              className="text-sm mt-2 font-medium"
              style={{ color: ringColor }}
            >
              ₹{remaining.toFixed(0)} remaining
            </p>
          ) : (
            <p className="text-destructive text-sm mt-2 font-medium">
              Budget exceeded!
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function Dashboard({
  logs,
  settings,
  onAddCigarette,
  isLoading,
  onOpenSettings,
}: DashboardProps) {
  const stats = computeStats(logs, settings);
  const insightIdx = useRef(
    Math.floor(Math.random() * INSIGHTS.length),
  ).current;

  const animatedTodaySpent = useCountUp(stats.todaySpent);
  const animatedMonthSpent = useCountUp(stats.monthSpent);
  const animatedYearly = useCountUp(stats.yearlyProjection);
  const animatedLifetime = useCountUp(
    logs.reduce((s, l) => s + l.totalSpent, 0),
  );

  const limitProgress =
    stats.dailyLimit > 0
      ? Math.min(100, (stats.todayCigs / stats.dailyLimit) * 100)
      : 0;
  const overLimit = stats.dailyLimit > 0 && stats.todayCigs >= stats.dailyLimit;

  const limitColor =
    limitProgress < 70
      ? "bg-success"
      : limitProgress < 90
        ? "bg-warning"
        : "bg-destructive";

  // Last smoked timestamp
  const lastLog = [...logs]
    .filter((l) => l.date === new Date().toISOString().split("T")[0])
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))[0];
  const lastSmokedStr = lastLog
    ? new Date(Number(lastLog.timestamp) / 1_000_000).toLocaleTimeString(
        "en-IN",
        { hour: "2-digit", minute: "2-digit" },
      )
    : null;

  const logDatesSet = new Set(logs.map((l) => l.date));
  const weekDots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    const dayOfWeek = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
    const target = new Date(monday);
    target.setDate(monday.getDate() + i);
    const dateStr = target.toISOString().split("T")[0];
    const isToday = dateStr === new Date().toISOString().split("T")[0];
    return {
      label: WEEK_DAYS[i],
      dateStr,
      active: logDatesSet.has(dateStr),
      isToday,
    };
  });

  const weeklySpent = stats.last7.reduce((s, d) => s + d.spent, 0);
  const animatedWeekly = useCountUp(weeklySpent);

  // --- Quit Date ---
  let quitDate: Date | null = null;
  let quitDateStr = "";
  try {
    const raw = localStorage.getItem("smoketrack_quit_date");
    if (raw) {
      quitDate = new Date(raw);
      quitDateStr = quitDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  } catch {
    // ignore
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysToQuit = quitDate
    ? Math.ceil((quitDate.getTime() - today.getTime()) / 86400000)
    : null;

  // --- Savings Goal ---
  let savingsGoal: number | null = null;
  try {
    const raw = localStorage.getItem("smoketrack_savings_goal");
    if (raw) savingsGoal = Number(raw);
  } catch {
    // ignore
  }

  // --- Health Recovery ---
  const allLogsSorted = [...logs].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp),
  );
  const mostRecentLog = allLogsSorted[0];
  const timeSinceLastMs = mostRecentLog
    ? Date.now() - Number(mostRecentLog.timestamp) / 1_000_000
    : null;

  // --- Money saved card values ---
  const savingsIf2Less = 2 * settings.pricePerCigarette * 30;
  const savingsIf2LessYearly = savingsIf2Less * 12;

  return (
    <div className="flex flex-col gap-4 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
            {getGreeting()}
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground leading-tight">
            Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-muted/50 border border-border text-muted-foreground px-3 py-1.5 rounded-pill">
            <Calendar className="w-3 h-3" />
            <span className="text-[10px] font-medium">{formatDate()}</span>
          </div>
          {stats.loggingStreak > 0 && (
            <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary px-2.5 py-1.5 rounded-pill">
              <Flame className="w-3 h-3" />
              <span className="text-[10px] font-bold">
                {stats.loggingStreak}d
              </span>
            </div>
          )}
          <button
            type="button"
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-muted/40 border border-border text-muted-foreground hover:text-foreground transition-colors"
            onClick={onOpenSettings}
            data-ocid="dashboard.open_modal_button"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Glass Hero Card */}
      <motion.div
        className="glass-card rounded-3xl p-6 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        data-ocid="dashboard.card"
      >
        {/* Ambient orb — subtle gold */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

        <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest mb-1 relative z-10">
          Today's Spending
        </p>
        <motion.p
          className="font-display text-5xl font-bold gradient-text mb-2 relative z-10 leading-none"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          {isLoading ? "--" : formatCurrency(animatedTodaySpent)}
        </motion.p>

        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="flex items-center gap-1.5">
            <Cigarette className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">
              {isLoading ? "--" : stats.todayCigs} cigarettes today
            </span>
          </div>
          {lastSmokedStr && (
            <span className="text-[10px] font-medium px-2 py-0.5 bg-muted/50 border border-border text-muted-foreground rounded-pill">
              Last at {lastSmokedStr}
            </span>
          )}
        </div>

        {/* Daily limit progress */}
        {stats.dailyLimit > 0 && (
          <div className="relative z-10">
            {overLimit ? (
              <motion.div
                className="rounded-xl px-4 py-2.5 bg-destructive/10 border border-destructive/30 flex items-center gap-2"
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              >
                <Target className="w-4 h-4 text-destructive flex-shrink-0" />
                <span className="text-destructive text-sm font-semibold">
                  Daily limit reached — every extra costs ₹
                  {settings.pricePerCigarette}
                </span>
              </motion.div>
            ) : (
              <>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Daily limit</span>
                  <span className="text-foreground font-medium">
                    {stats.todayCigs} / {stats.dailyLimit} cigarettes
                  </span>
                </div>
                <AnimatedProgressBar value={limitProgress} color={limitColor} />
              </>
            )}
          </div>
        )}
      </motion.div>

      {/* Secondary stats grid 2×2 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: "Weekly",
            value: formatCurrency(animatedWeekly),
            icon: <BarChart2 className="w-3.5 h-3.5 text-primary" />,
            badge: "this week",
            delay: 0.06,
          },
          {
            label: "Monthly",
            value: formatCurrency(animatedMonthSpent),
            icon: <Calendar className="w-3.5 h-3.5 text-muted-foreground" />,
            badge: "this month",
            delay: 0.1,
          },
          {
            label: "Yearly Est.",
            value: formatCurrency(animatedYearly),
            icon: <TrendingUp className="w-3.5 h-3.5 text-primary" />,
            badge: "projection",
            delay: 0.14,
          },
          {
            label: "Lifetime",
            value: formatCurrency(animatedLifetime),
            icon: <Zap className="w-3.5 h-3.5 text-muted-foreground" />,
            badge: "total",
            delay: 0.18,
          },
        ].map((item) => (
          <motion.div
            key={item.label}
            className="surface-card rounded-2xl p-4 card-lift"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: item.delay,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              {item.icon}
              <span className="text-muted-foreground text-xs">
                {item.label}
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-foreground leading-none">
              {isLoading ? "--" : item.value}
            </p>
            <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-pill bg-muted/50 text-muted-foreground">
              {item.badge}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Week activity strip */}
      <motion.div
        className="surface-card rounded-2xl p-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.22,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        <p className="text-muted-foreground text-xs font-medium mb-3">
          This week
        </p>
        <div className="flex items-center justify-between">
          {weekDots.map((day) => (
            <div key={day.label} className="flex flex-col items-center gap-1.5">
              <span
                className={`text-[10px] font-medium ${
                  day.isToday ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {day.label}
              </span>
              <div
                className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                  day.active
                    ? "bg-primary/20 border-primary/50"
                    : "border-border/40 bg-transparent"
                } ${
                  day.isToday
                    ? "ring-1 ring-primary/30 ring-offset-1 ring-offset-background"
                    : ""
                }`}
              >
                {day.active && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Insights strip — gold tint */}
      <motion.div
        className="rounded-2xl p-4 bg-primary/6 border border-primary/15"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.26,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {getInsightText(stats.monthSpent, insightIdx)}
          </p>
        </div>
      </motion.div>

      {/* Quit Date Countdown */}
      {quitDate && (
        <motion.div
          className="glass-card rounded-2xl p-5 relative overflow-hidden"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.29,
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
          data-ocid="dashboard.panel"
        >
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-primary/8 blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  Quit Date
                </p>
                <p className="text-foreground text-sm font-semibold">
                  {quitDateStr}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="text-muted-foreground text-xs hover:text-foreground transition-colors"
              onClick={onOpenSettings}
            >
              change
            </button>
          </div>
          {daysToQuit !== null && daysToQuit > 0 ? (
            <div className="mt-4">
              <p className="font-display text-4xl font-bold gradient-text leading-none">
                {daysToQuit}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                days to go — you've got this
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-success text-base font-semibold">
                Today is your quit date!
              </p>
              <p className="text-muted-foreground text-sm mt-0.5">
                Every cigarette you skip today is a victory.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Savings Goal Ring */}
      {savingsGoal !== null && savingsGoal > 0 && (
        <SavingsGoalRing spent={stats.monthSpent} goal={savingsGoal} />
      )}

      {/* Health Recovery Timeline */}
      {timeSinceLastMs !== null && (
        <motion.div
          className="surface-card rounded-2xl p-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.32,
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-destructive" />
            <p className="text-foreground text-sm font-semibold">
              Recovery Clock
            </p>
          </div>
          <p className="text-muted-foreground text-xs mb-4">
            Last smoked {formatTimeSince(timeSinceLastMs)}
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {MILESTONES.map((m) => {
              const achieved = timeSinceLastMs >= m.ms;
              return (
                <div
                  key={m.label}
                  className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all ${
                    achieved
                      ? "bg-primary/10 border-primary/30"
                      : "bg-muted/30 border-border/40"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      achieved ? "bg-primary" : "bg-muted-foreground/40"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-bold ${
                      achieved ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {m.label}
                  </span>
                  <span
                    className={`text-[10px] text-center leading-tight ${
                      achieved ? "text-foreground" : "text-muted-foreground/60"
                    }`}
                  >
                    {m.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Money Saved Card */}
      <motion.div
        className="rounded-2xl p-4 bg-muted/50 border border-border"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.36,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
            <PiggyBank className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-foreground text-sm font-semibold">
              Skip 2 cigarettes/day = save ₹{savingsIf2Less.toFixed(0)}/month
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              That's ₹{savingsIf2LessYearly.toFixed(0)}/year — a real vacation
            </p>
          </div>
        </div>
      </motion.div>

      {/* Streaks */}
      {(stats.loggingStreak > 0 || stats.reductionStreak > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {stats.loggingStreak > 0 && (
            <motion.div
              className="glass-card rounded-2xl p-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.4,
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
            >
              <Flame className="w-4 h-4 text-primary mb-2" />
              <p className="font-display text-2xl font-bold text-primary leading-none">
                {stats.loggingStreak}
                <span className="text-sm font-medium ml-1 text-muted-foreground">
                  days
                </span>
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Logging streak
              </p>
            </motion.div>
          )}
          {stats.reductionStreak > 0 && (
            <motion.div
              className="glass-card rounded-2xl p-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.44,
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
            >
              <Target className="w-4 h-4 text-success mb-2" />
              <p className="font-display text-2xl font-bold text-success leading-none">
                {stats.reductionStreak}
                <span className="text-sm font-medium ml-1 text-muted-foreground">
                  days
                </span>
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Reducing trend
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Sticky Log Button */}
      <motion.button
        type="button"
        className="fixed left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-2 px-8 h-14 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-base glow-primary bounce-tap shadow-xl"
        style={{ bottom: "80px", maxWidth: "calc(430px - 32px)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}
        whileTap={{ scale: 0.96 }}
        onClick={onAddCigarette}
        data-ocid="dashboard.primary_button"
      >
        <Plus className="w-5 h-5" />
        Log Cigarette
      </motion.button>
    </div>
  );
}
