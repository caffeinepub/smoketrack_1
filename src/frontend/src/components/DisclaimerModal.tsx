import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "smoketrack_disclaimer_shown";

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const shown = localStorage.getItem(STORAGE_KEY);
    if (!shown) setOpen(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-ocid="disclaimer.modal"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            className="relative w-full max-w-sm bg-card rounded-2xl p-6 card-glow"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-orange" />
              </div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Important Notice
              </h2>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-2">
              This app is for{" "}
              <span className="text-foreground font-medium">
                awareness and habit tracking only
              </span>
              . It does not promote smoking.
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed mb-6">
              SmokeTrack helps you understand the financial and health impact of
              smoking to support your journey toward healthier choices.
            </p>
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl h-12"
              onClick={handleDismiss}
              data-ocid="disclaimer.confirm_button"
            >
              I Understand
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
