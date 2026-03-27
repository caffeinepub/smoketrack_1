import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, Cigarette, Shield } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useSaveSettings } from "../hooks/useQueries";

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [screen, setScreen] = useState(0);
  const [price, setPrice] = useState("15");
  const [limit, setLimit] = useState(10);
  const saveSettings = useSaveSettings();

  const handleFinish = async () => {
    const priceNum = Number.parseFloat(price);
    try {
      await saveSettings.mutateAsync({
        pricePerCigarette:
          Number.isNaN(priceNum) || priceNum <= 0 ? 15 : priceNum,
        dailyLimitGoal: BigInt(limit),
        notificationsEnabled: true,
      });
    } catch {
      // ignore — proceed anyway
    }
    try {
      localStorage.setItem("smoketrack_onboarded", "true");
    } catch {
      // ignore
    }
    onComplete();
  };

  const screens = [
    {
      key: "welcome",
      content: (
        <div className="flex flex-col items-center text-center gap-6">
          <motion.div
            className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(62% 0.18 265), oklch(78% 0.14 65))",
              boxShadow: "0 0 40px oklch(62% 0.18 265 / 0.4)",
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Cigarette className="w-10 h-10 text-white" />
          </motion.div>
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-3xl font-bold text-foreground leading-tight">
              Know your habit.
              <br />
              Own your money.
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              SmokeTrack helps you see exactly what smoking costs — so you can
              decide what to change.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-muted/40 border border-border px-4 py-2 rounded-full">
            <Shield className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground text-xs font-medium">
              For awareness only · Not promoting smoking
            </span>
          </div>
          <Button
            className="w-full h-13 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-base bounce-tap"
            onClick={() => setScreen(1)}
            data-ocid="onboarding.primary_button"
          >
            Get Started
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      ),
    },
    {
      key: "price",
      content: (
        <div className="flex flex-col gap-6 w-full">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-foreground">
              What does one cigarette cost you?
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              Check your pack price. Divide by 20.
            </p>
          </div>
          <div className="surface-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <span className="font-display text-3xl font-bold text-foreground">
                ₹
              </span>
              <Input
                type="number"
                min="0.5"
                step="0.5"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-muted/40 border-border focus:border-primary/50 text-foreground h-14 rounded-xl text-2xl font-display font-bold text-center transition-colors"
                placeholder="15"
                data-ocid="onboarding.input"
              />
            </div>
            <p className="text-muted-foreground text-xs mt-3 text-center">
              Most cigarettes in India cost ₹10–₹20 each
            </p>
          </div>
          <Button
            className="w-full h-13 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-base bounce-tap"
            onClick={() => setScreen(2)}
            data-ocid="onboarding.primary_button"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      ),
    },
    {
      key: "limit",
      content: (
        <div className="flex flex-col gap-6 w-full">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-foreground">
              How many per day is your limit?
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              We'll warn you when you approach this.
            </p>
          </div>
          <div className="surface-card rounded-2xl p-5">
            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                className="w-14 h-14 rounded-2xl bg-muted/60 border border-border text-foreground font-display text-2xl font-bold flex items-center justify-center transition-all active:scale-95"
                onClick={() => setLimit((l) => Math.max(1, l - 1))}
                data-ocid="onboarding.secondary_button"
              >
                −
              </button>
              <div className="flex flex-col items-center gap-1">
                <span className="font-display text-5xl font-bold gradient-text">
                  {limit}
                </span>
                <span className="text-muted-foreground text-xs">per day</span>
              </div>
              <button
                type="button"
                className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 text-primary font-display text-2xl font-bold flex items-center justify-center transition-all active:scale-95"
                onClick={() => setLimit((l) => l + 1)}
                data-ocid="onboarding.primary_button"
              >
                +
              </button>
            </div>
          </div>
          <Button
            className="w-full h-13 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-base bounce-tap"
            onClick={handleFinish}
            disabled={saveSettings.isPending}
            data-ocid="onboarding.submit_button"
          >
            {saveSettings.isPending ? "Setting up..." : "Start Tracking"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            className="w-full flex flex-col items-center"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            {screens[screen].content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pb-12">
        {screens.map((s, i) => (
          <div
            key={s.key}
            className={`rounded-full transition-all duration-300 ${
              i === screen
                ? "w-6 h-2 bg-primary"
                : i < screen
                  ? "w-2 h-2 bg-primary/60"
                  : "w-2 h-2 bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
