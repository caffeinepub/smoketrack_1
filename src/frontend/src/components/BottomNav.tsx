import { BarChart2, Clock, House, Plus } from "lucide-react";

type Tab = "home" | "add" | "insights" | "history";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: typeof House }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "add", label: "Log", icon: Plus },
  { id: "insights", label: "Insights", icon: BarChart2 },
  { id: "history", label: "History", icon: Clock },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40">
      <div className="bg-background/90 backdrop-blur-xl border-t border-border">
        <div className="flex items-stretch">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className="flex-1 flex flex-col items-center gap-1 py-3 relative transition-colors"
                data-ocid={`nav.${tab.id}.link`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors duration-150 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors duration-150 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
