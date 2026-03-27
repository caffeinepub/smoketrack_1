import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart2,
  Cigarette,
  Loader2,
  Shield,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AddEntry } from "./components/AddEntry";
import { BottomNav } from "./components/BottomNav";
import { Dashboard } from "./components/Dashboard";
import { DisclaimerModal } from "./components/DisclaimerModal";
import { History } from "./components/History";
import { Insights } from "./components/Insights";
import { Onboarding } from "./components/Onboarding";
import { Settings } from "./components/Settings";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  DEFAULT_SETTINGS,
  useGetLogs,
  useGetSettings,
} from "./hooks/useQueries";

type Tab = "home" | "add" | "insights" | "history";

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Cigarette className="w-6 h-6 text-primary" />
      </div>
      <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      <p className="text-muted-foreground text-sm">Loading your data...</p>
    </div>
  );
}

const FEATURES = [
  { icon: Wallet, text: "Track every rupee spent on smoking" },
  { icon: TrendingDown, text: "Visualize your reduction progress" },
  { icon: BarChart2, text: "Deep analytics on spending trends" },
  { icon: Shield, text: "Private, secure — only you can see this" },
];

function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <motion.div
          className="flex flex-col items-center gap-5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="w-20 h-20 rounded-3xl glass-card flex items-center justify-center">
            <Cigarette className="w-9 h-9 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold text-foreground">
              SmokeTrack
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Smart Smoking Expense Tracker
            </p>
          </div>
        </motion.div>

        <motion.div
          className="w-full flex flex-col gap-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.15,
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.text}
              className="flex items-center gap-3 surface-card rounded-xl px-4 py-3"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.2 + i * 0.06,
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-foreground text-sm">{f.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div
        className="px-6 pb-10 pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 25 }}
      >
        <Button
          className="w-full h-13 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-base glow-primary bounce-tap"
          onClick={() => login()}
          disabled={isLoggingIn}
          data-ocid="login.primary_button"
        >
          {isLoggingIn ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : null}
          {isLoggingIn ? "Connecting..." : "Sign In to Continue"}
        </Button>
        <p className="text-muted-foreground text-xs text-center mt-3">
          Secure login · Your data stays private
        </p>
        <p className="text-muted-foreground text-[11px] text-center mt-4 leading-relaxed px-2">
          This app is for awareness purposes only. It does not promote smoking.
        </p>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showSettings, setShowSettings] = useState(false);
  const { data: logs = [], isLoading: logsLoading } = useGetLogs();
  const { data: settings = DEFAULT_SETTINGS, isLoading: settingsLoading } =
    useGetSettings();
  const { isFetching: actorFetching } = useActor();

  const isLoading = logsLoading || settingsLoading || actorFetching;

  // Onboarding check
  let onboarded = false;
  try {
    onboarded = localStorage.getItem("smoketrack_onboarded") === "true";
  } catch {
    onboarded = true;
  }
  const [showOnboarding, setShowOnboarding] = useState(!onboarded);

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  const handleAddCigarette = () => setActiveTab("add");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <Dashboard
            logs={logs}
            settings={settings}
            onAddCigarette={handleAddCigarette}
            isLoading={isLoading}
            onOpenSettings={() => setShowSettings(true)}
          />
        );
      case "add":
        return <AddEntry logs={logs} settings={settings} />;
      case "insights":
        return <Insights logs={logs} settings={settings} />;
      case "history":
        return (
          <History logs={logs} onNavigateToAdd={() => setActiveTab("add")} />
        );
    }
  };

  return (
    <>
      <DisclaimerModal />
      <div className="relative flex flex-col min-h-full">
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
          {isLoading && activeTab === "home" ? (
            <LoadingScreen />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
        <BottomNav active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Settings Sheet */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent
          side="bottom"
          className="bg-background border-border rounded-t-3xl max-h-[90dvh] overflow-y-auto px-4 pt-2 pb-0"
          data-ocid="settings.sheet"
        >
          <SheetHeader className="mb-1">
            <SheetTitle className="sr-only">Settings</SheetTitle>
          </SheetHeader>
          <Settings settings={settings} />
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center w-full h-dvh max-w-[430px] mx-auto">
        <Loader2 className="w-7 h-7 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[430px] mx-auto h-dvh flex flex-col bg-background overflow-hidden relative">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(10% 0.006 285)",
            border: "1px solid oklch(77% 0.09 78 / 0.15)",
            color: "oklch(94% 0.005 75)",
            fontFamily: "Satoshi, system-ui, sans-serif",
          },
        }}
      />
      {isAuthenticated ? <AppContent /> : <LoginScreen />}
    </div>
  );
}
