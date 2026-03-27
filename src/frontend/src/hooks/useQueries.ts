import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SmokingLog, UserSettings } from "../backend";
import { useActor } from "./useActor";

export type { SmokingLog, UserSettings };

export const DEFAULT_SETTINGS: UserSettings = {
  pricePerCigarette: 15,
  dailyLimitGoal: BigInt(10),
  notificationsEnabled: true,
};

export function useGetLogs() {
  const { actor, isFetching } = useActor();
  return useQuery<SmokingLog[]>({
    queryKey: ["logs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLogs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<UserSettings>({
    queryKey: ["settings"],
    queryFn: async () => {
      if (!actor) return DEFAULT_SETTINGS;
      return actor.getSettings();
    },
    enabled: !!actor && !isFetching,
    placeholderData: DEFAULT_SETTINGS,
  });
}

export function useAddLog() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      date,
      cigarettesCount,
      pricePerUnit,
    }: {
      date: string;
      cigarettesCount: number;
      pricePerUnit: number;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addLog(date, BigInt(cigarettesCount), pricePerUnit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
  });
}

export function useSaveSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: UserSettings) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useDeleteLog() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteLog(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
  });
}

// --- Computed helpers ---
export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function computeStats(logs: SmokingLog[], settings: UserSettings) {
  const today = getTodayDate();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const todayLogs = logs.filter((l) => l.date === today);
  const todayCigs = todayLogs.reduce(
    (s, l) => s + Number(l.cigarettesCount),
    0,
  );
  const todaySpent = todayLogs.reduce((s, l) => s + l.totalSpent, 0);

  const monthLogs = logs.filter((l) => {
    const d = new Date(l.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthSpent = monthLogs.reduce((s, l) => s + l.totalSpent, 0);
  const yearlyProjection = monthSpent * 12;

  // Logging streak: consecutive days ending today with at least one log
  const logDates = new Set(logs.map((l) => l.date));
  let loggingStreak = 0;
  const checkDate = new Date();
  while (logDates.has(checkDate.toISOString().split("T")[0])) {
    loggingStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Reduction streak: consecutive days where count < previous day
  const dailyMap = new Map<string, number>();
  for (const log of logs) {
    dailyMap.set(
      log.date,
      (dailyMap.get(log.date) ?? 0) + Number(log.cigarettesCount),
    );
  }
  const sortedDates = Array.from(dailyMap.keys()).sort();
  let reductionStreak = 0;
  for (let i = sortedDates.length - 1; i >= 1; i--) {
    const curr = dailyMap.get(sortedDates[i]) ?? 0;
    const prev = dailyMap.get(sortedDates[i - 1]) ?? 0;
    if (curr < prev) reductionStreak++;
    else break;
  }

  // Last 7 days data for charts
  const last7: { date: string; label: string; cigs: number; spent: number }[] =
    [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-IN", { weekday: "short" });
    last7.push({
      date: dateStr,
      label,
      cigs: dailyMap.get(dateStr) ?? 0,
      spent: logs
        .filter((l) => l.date === dateStr)
        .reduce((s, l) => s + l.totalSpent, 0),
    });
  }

  const savingsIf2Less = 2 * settings.pricePerCigarette * 30;

  return {
    todayCigs,
    todaySpent,
    monthSpent,
    yearlyProjection,
    loggingStreak,
    reductionStreak,
    last7,
    savingsIf2Less,
    dailyLimit: Number(settings.dailyLimitGoal),
  };
}
