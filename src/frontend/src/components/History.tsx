import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cigarette, Clock, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { SmokingLog } from "../hooks/useQueries";
import { useDeleteLog } from "../hooks/useQueries";

interface HistoryProps {
  logs: SmokingLog[];
  onNavigateToAdd: () => void;
}

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(timestampNano: bigint) {
  const ms = Number(timestampNano) / 1_000_000;
  return new Date(ms).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function History({ logs, onNavigateToAdd }: HistoryProps) {
  const deleteLog = useDeleteLog();
  const [pendingDeleteId, setPendingDeleteId] = useState<bigint | null>(null);

  const handleDelete = async () => {
    if (pendingDeleteId === null) return;
    try {
      await deleteLog.mutateAsync(pendingDeleteId);
      toast.success("Log deleted");
    } catch {
      toast.error("Failed to delete log");
    } finally {
      setPendingDeleteId(null);
    }
  };

  // Group logs by date, sorted most recent first
  const grouped = new Map<string, SmokingLog[]>();
  for (const log of logs) {
    const existing = grouped.get(log.date) ?? [];
    grouped.set(log.date, [...existing, log]);
  }
  const sortedDates = Array.from(grouped.keys()).sort((a, b) =>
    b.localeCompare(a),
  );

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
            All Time
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground leading-tight">
            History
          </h1>
        </div>
        <Badge
          variant="secondary"
          className="font-mono text-xs px-2.5 py-1"
          data-ocid="history.card"
        >
          {logs.length} logs
        </Badge>
      </div>

      {/* Empty state */}
      {logs.length === 0 && (
        <motion.div
          className="flex flex-col items-center justify-center gap-5 py-20"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          data-ocid="history.empty_state"
        >
          <div className="w-20 h-20 rounded-3xl bg-muted/40 border border-border flex items-center justify-center">
            <Clock className="w-9 h-9 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-semibold text-base">
              No logs yet
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Start tracking from the Log tab.
            </p>
          </div>
          <Button
            className="rounded-2xl bg-primary text-primary-foreground font-semibold bounce-tap"
            onClick={onNavigateToAdd}
            data-ocid="history.primary_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log First Entry
          </Button>
        </motion.div>
      )}

      {/* Log groups */}
      {sortedDates.map((date, dateIdx) => {
        const dayLogs = (grouped.get(date) ?? []).sort(
          (a, b) => Number(b.timestamp) - Number(a.timestamp),
        );
        const dayCigs = dayLogs.reduce(
          (s, l) => s + Number(l.cigarettesCount),
          0,
        );
        const daySpent = dayLogs.reduce((s, l) => s + l.totalSpent, 0);

        return (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: dateIdx * 0.04,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            data-ocid={`history.item.${dateIdx + 1}`}
          >
            {/* Date group header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-foreground text-sm font-semibold">
                {formatDate(date)}
              </p>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Cigarette className="w-3 h-3" />
                  {dayCigs}
                </span>
                <span className="text-muted-foreground text-xs">
                  ₹{daySpent.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Entries */}
            <div className="surface-card rounded-2xl overflow-hidden">
              {dayLogs.map((log, logIdx) => (
                <div key={String(log.id)}>
                  {logIdx > 0 && (
                    <div className="border-t border-border/50 mx-4" />
                  )}
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Cigarette className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-semibold">
                        {Number(log.cigarettesCount)} cigarette
                        {Number(log.cigarettesCount) !== 1 ? "s" : ""}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatTime(log.timestamp)} · ₹{log.pricePerUnit} each
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-foreground text-sm font-semibold">
                        ₹{log.totalSpent.toFixed(0)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1 flex-shrink-0"
                      onClick={() => setPendingDeleteId(log.id)}
                      data-ocid={`history.delete_button.${dateIdx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent
          className="bg-card border-border rounded-2xl"
          data-ocid="history.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-display">
              Delete log entry?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl border-border"
              data-ocid="history.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground"
              onClick={handleDelete}
              disabled={deleteLog.isPending}
              data-ocid="history.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
