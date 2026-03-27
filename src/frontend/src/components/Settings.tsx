import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Cigarette,
  FileText,
  Info,
  Loader2,
  LogOut,
  Save,
  Shield,
  Target,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { UserSettings } from "../hooks/useQueries";
import { useSaveSettings } from "../hooks/useQueries";

interface SettingsProps {
  settings: UserSettings;
}

function SettingSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
        {icon}
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
          {title}
        </p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Settings({ settings }: SettingsProps) {
  const [price, setPrice] = useState(settings.pricePerCigarette.toString());
  const [limit, setLimit] = useState(
    Number(settings.dailyLimitGoal).toString(),
  );
  const [notifications, setNotifications] = useState(
    settings.notificationsEnabled,
  );
  const saveSettings = useSaveSettings();
  const queryClient = useQueryClient();
  const { clear, identity } = useInternetIdentity();

  // Profile
  const [username, setUsername] = useState(() => {
    try {
      return localStorage.getItem("smoketrack_username") ?? "";
    } catch {
      return "";
    }
  });

  // Goals
  const [quitDate, setQuitDate] = useState(() => {
    try {
      return localStorage.getItem("smoketrack_quit_date") ?? "";
    } catch {
      return "";
    }
  });
  const [savingsGoal, setSavingsGoal] = useState(() => {
    try {
      return localStorage.getItem("smoketrack_savings_goal") ?? "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    setPrice(settings.pricePerCigarette.toString());
    setLimit(Number(settings.dailyLimitGoal).toString());
    setNotifications(settings.notificationsEnabled);
  }, [settings]);

  const handleSave = async () => {
    const priceNum = Number.parseFloat(price);
    const limitNum = Number.parseInt(limit, 10);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid price per cigarette.");
      return;
    }
    try {
      await saveSettings.mutateAsync({
        pricePerCigarette: priceNum,
        dailyLimitGoal: BigInt(
          Number.isNaN(limitNum) || limitNum < 0 ? 0 : limitNum,
        ),
        notificationsEnabled: notifications,
      });
      // Save localStorage values
      try {
        if (username.trim())
          localStorage.setItem("smoketrack_username", username.trim());
        else localStorage.removeItem("smoketrack_username");
        if (quitDate) localStorage.setItem("smoketrack_quit_date", quitDate);
        else localStorage.removeItem("smoketrack_quit_date");
        const goalNum = Number.parseFloat(savingsGoal);
        if (!Number.isNaN(goalNum) && goalNum > 0)
          localStorage.setItem("smoketrack_savings_goal", goalNum.toString());
        else localStorage.removeItem("smoketrack_savings_goal");
      } catch {
        // ignore localStorage errors
      }
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings.");
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="pt-2">
        <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
          Preferences
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground leading-tight">
          Settings
        </h1>
      </div>

      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <SettingSection
          icon={<User className="w-3.5 h-3.5 text-primary" />}
          title="Profile"
        >
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="username"
              className="text-foreground text-sm font-medium"
            >
              Your name
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-muted/40 border-border focus:border-primary/50 text-foreground h-11 rounded-xl text-base transition-colors"
              placeholder="Your name"
              data-ocid="settings.input"
            />
            {username.trim() && (
              <p className="text-muted-foreground text-xs">
                Hello, {username.trim()} 👋
              </p>
            )}
          </div>
        </SettingSection>
      </motion.div>

      {/* Tracking */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.04,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        <SettingSection
          icon={<Cigarette className="w-3.5 h-3.5 text-primary" />}
          title="Tracking"
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="price"
                className="text-foreground text-sm font-medium"
              >
                Price per cigarette (₹)
              </Label>
              <Input
                id="price"
                type="number"
                min="0.1"
                step="0.5"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-muted/40 border-border focus:border-primary/50 text-foreground h-11 rounded-xl text-base transition-colors"
                placeholder="e.g. 15"
                data-ocid="settings.input"
              />
            </div>
            <Separator className="bg-border/50" />
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="limit"
                className="text-foreground text-sm font-medium"
              >
                Daily cigarette limit
              </Label>
              <Input
                id="limit"
                type="number"
                min="0"
                step="1"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="bg-muted/40 border-border focus:border-primary/50 text-foreground h-11 rounded-xl text-base transition-colors"
                placeholder="e.g. 10"
                data-ocid="settings.input"
              />
              <p className="text-muted-foreground text-xs">
                Set to 0 to disable the daily limit bar.
              </p>
            </div>
          </div>
        </SettingSection>
      </motion.div>

      {/* Goals */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.08,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        <SettingSection
          icon={<Target className="w-3.5 h-3.5 text-primary" />}
          title="Goals"
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="quit-date"
                className="text-foreground text-sm font-medium"
              >
                Quit Date
              </Label>
              <Input
                id="quit-date"
                type="date"
                value={quitDate}
                onChange={(e) => setQuitDate(e.target.value)}
                className="bg-muted/40 border-border focus:border-primary/50 text-foreground h-11 rounded-xl text-base transition-colors"
                data-ocid="settings.input"
              />
              <p className="text-muted-foreground text-xs">
                Set a target date to quit. We'll show a countdown on your
                dashboard.
              </p>
            </div>
            <Separator className="bg-border/50" />
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="savings-goal"
                className="text-foreground text-sm font-medium"
              >
                Monthly budget alert (₹)
              </Label>
              <Input
                id="savings-goal"
                type="number"
                min="0"
                step="50"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(e.target.value)}
                className="bg-muted/40 border-border focus:border-primary/50 text-foreground h-11 rounded-xl text-base transition-colors"
                placeholder="e.g. 1500"
                data-ocid="settings.input"
              />
              <p className="text-muted-foreground text-xs">
                Alert me when monthly spend exceeds this amount.
              </p>
            </div>
          </div>
        </SettingSection>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.12,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        <SettingSection
          icon={<Bell className="w-3.5 h-3.5 text-primary" />}
          title="Notifications"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground text-sm font-medium">
                Daily reminders
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Reminds you to log your cigarettes
              </p>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
              data-ocid="settings.switch"
            />
          </div>
        </SettingSection>
      </motion.div>

      {/* Save */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.16,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        <Button
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base glow-primary bounce-tap"
          onClick={handleSave}
          disabled={saveSettings.isPending}
          data-ocid="settings.save_button"
        >
          {saveSettings.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saveSettings.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </motion.div>

      {/* About */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
      >
        <SettingSection
          icon={<Info className="w-3.5 h-3.5 text-muted-foreground" />}
          title="About"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-sm font-semibold">
                  SmokeTrack
                </p>
                <p className="text-muted-foreground text-xs">Version 5.0.0</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
            </div>
            <Separator className="bg-border/50" />
            <p className="text-muted-foreground text-xs leading-relaxed">
              SmokeTrack helps you understand the financial impact of smoking
              habits. For awareness purposes only — it does not promote smoking.
            </p>
            {identity && (
              <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                <Shield className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <p className="text-muted-foreground text-xs font-mono truncate">
                  {identity.getPrincipal().toString().slice(0, 24)}...
                </p>
              </div>
            )}
          </div>
        </SettingSection>
      </motion.div>

      {/* Privacy Policy */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.24,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        <div className="surface-card rounded-2xl overflow-hidden">
          <Accordion type="single" collapsible>
            <AccordionItem value="privacy" className="border-0">
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Privacy Policy
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent
                className="px-5 pb-5"
                data-ocid="settings.panel"
              >
                <div className="flex flex-col gap-4 text-muted-foreground text-xs leading-relaxed">
                  <div>
                    <p className="text-foreground text-sm font-semibold mb-1">
                      Data Storage
                    </p>
                    <p>
                      All your smoking logs and settings are stored securely on
                      the Internet Computer blockchain. Only you can access your
                      data using your Internet Identity.
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-semibold mb-1">
                      No Personal Data Collected
                    </p>
                    <p>
                      We do not collect your name, phone number, email, or
                      location.
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-semibold mb-1">
                      No Third-Party Sharing
                    </p>
                    <p>
                      Your data is never shared with advertisers or third
                      parties.
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-semibold mb-1">
                      Purpose
                    </p>
                    <p>
                      This app is strictly for personal habit tracking and
                      awareness.
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-semibold mb-1">
                      Contact
                    </p>
                    <p>For support, use the feedback option in the app.</p>
                  </div>
                  <p className="text-muted-foreground/60 text-[11px] pt-1 border-t border-border">
                    Last updated: March 2026
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </motion.div>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.28,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        <Button
          variant="outline"
          className="w-full h-11 rounded-xl border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          onClick={handleLogout}
          data-ocid="settings.secondary_button"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </motion.div>

      <div className="text-center pb-2">
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
