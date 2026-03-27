import { Button } from "@/components/ui/button";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cigarette,
  Clock,
  Loader2,
  Minus,
  Plus,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { SmokingLog, UserSettings } from "../hooks/useQueries";
import { computeStats, getTodayDate, useAddLog } from "../hooks/useQueries";

interface AddEntryProps {
  logs: SmokingLog[];
  settings: UserSettings;
}

function formatTime(ts: bigint) {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AddEntry({ logs, settings }: AddEntryProps) {
  const stats = computeStats(logs, settings);
  const [count, setCount] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [customExpanded, setCustomExpanded] = useState(false);
  const [customPrice, setCustomPrice] = useState(
    settings.pricePerCigarette.toString(),
  );
  const addLog = useAddLog();

  const effectivePrice = customExpanded
    ? Number.parseFloat(customPrice) || settings.pricePerCigarette
    : settings.pricePerCigarette;
  const totalCost = count * effectivePrice;

  const todayLogs = logs
    .filter((l) => l.date === getTodayDate())
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    .slice(0, 5);

  const handleLog = async () => {
    try {
      await addLog.mutateAsync({
        date: getTodayDate(),
        cigarettesCount: count,
        pricePerUnit: effectivePrice,
      });
      setShowSuccess(true);
      const time = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      toast.success(
        `Logged at ${time} — ₹${(count * effectivePrice).toFixed(0)} recorded`,
      );
      setCount(1);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <div className="pt-2">
        <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
          Quick Log
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground leading-tight">
          Add Entry
        </h1>
      </div>

      {/* Large Log Button */}
      <motion.button
        type="button"
        className="relative w-full rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-lg glow-primary overflow-hidden"
        style={{ minHeight: "96px" }}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={handleLog}
        disabled={addLog.isPending}
        data-ocid="add.primary_button"
      >
        {/* Subtle shimmer */}
        <motion.div
          className="absolute inset-0 bg-white/8"
          animate={{ opacity: [0, 0.15, 0] }}
          transition={{
            duration: 2.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              className="flex items-center justify-center gap-3 p-6"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <CheckCircle2 className="w-8 h-8" />
              <span className="text-xl">Logged successfully!</span>
            </motion.div>
          ) : addLog.isPending ? (
            <motion.div
              key="loading"
              className="flex items-center justify-center gap-3 p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Saving...</span>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              className="flex flex-col items-center justify-center gap-1 p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2">
                <Cigarette className="w-6 h-6" />
                <span>Log Cigarette</span>
              </div>
              <p className="text-primary-foreground/60 text-sm">
                ₹{effectivePrice.toFixed(0)} per cigarette
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Today's stats */}
      <motion.div
        className="surface-card rounded-2xl p-4 flex items-center justify-between"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.06,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Cigarette className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Today</p>
            <p className="font-display text-xl font-bold text-foreground">
              {stats.todayCigs}
              <span className="text-sm font-medium ml-1 text-muted-foreground">
                cigs
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Spent</p>
            <p className="font-display text-xl font-bold text-foreground">
              ₹{stats.todaySpent.toFixed(0)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-muted/40 border border-border flex items-center justify-center">
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </motion.div>

      {/* Counter */}
      <motion.div
        className="surface-card rounded-2xl p-6 flex flex-col items-center gap-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
      >
        <p className="text-muted-foreground text-sm">Log multiple at once</p>
        <div className="flex items-center gap-8">
          <button
            type="button"
            className="w-14 h-14 rounded-full surface-card flex items-center justify-center bounce-tap"
            onClick={() => setCount((c) => Math.max(1, c - 1))}
            data-ocid="add.secondary_button"
          >
            <Minus className="w-5 h-5 text-foreground" />
          </button>
          <AnimatePresence mode="wait">
            <motion.span
              key={count}
              className="font-display text-6xl font-bold gradient-text w-20 text-center leading-none"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              {count}
            </motion.span>
          </AnimatePresence>
          <button
            type="button"
            className="w-14 h-14 rounded-full bg-primary flex items-center justify-center bounce-tap glow-primary"
            onClick={() => setCount((c) => c + 1)}
            data-ocid="add.primary_button"
          >
            <Plus className="w-6 h-6 text-primary-foreground" />
          </button>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground text-xs mb-1">
            ₹{effectivePrice.toFixed(0)}/cig × {count}
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={totalCost}
              className="font-display text-3xl font-bold text-foreground"
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
            >
              = ₹{totalCost.toFixed(0)}
            </motion.p>
          </AnimatePresence>
        </div>

        <Button
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold bounce-tap"
          onClick={handleLog}
          disabled={addLog.isPending || showSuccess}
          data-ocid="add.submit_button"
        >
          {addLog.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : showSuccess ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          {addLog.isPending
            ? "Saving..."
            : showSuccess
              ? "Saved!"
              : "Save Entry"}
        </Button>
      </motion.div>

      {/* Custom entry expander */}
      <motion.div
        className="surface-card rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.14,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground"
          onClick={() => setCustomExpanded((v) => !v)}
          data-ocid="add.toggle"
        >
          <span>Custom price override</span>
          {customExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        <AnimatePresence>
          {customExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-border">
                <p className="text-muted-foreground text-xs mt-3 mb-2">
                  Override price for this entry (₹)
                </p>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full h-10 rounded-xl bg-muted/40 border border-border text-foreground text-sm px-3 focus:outline-none focus:border-primary/50"
                  placeholder={`Default: ₹${settings.pricePerCigarette}`}
                  data-ocid="add.input"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Recent logs */}
      {todayLogs.length > 0 && (
        <motion.div
          className="surface-card rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.18,
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
        >
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Today's logs
            </p>
          </div>
          <div className="flex flex-col" data-ocid="add.list">
            {todayLogs.map((log, idx) => (
              <div
                key={log.id.toString()}
                className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0"
                data-ocid={`add.item.${idx + 1}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">
                      Today {formatTime(log.timestamp)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {Number(log.cigarettesCount)} cig
                      {Number(log.cigarettesCount) > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <p className="text-foreground text-sm font-semibold">
                  ₹{log.totalSpent.toFixed(0)}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
