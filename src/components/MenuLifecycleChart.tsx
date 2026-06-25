import { MenuLifecycleItem } from "@/services/api";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Rocket } from "lucide-react";

interface MenuLifecycleChartProps {
  data: MenuLifecycleItem[];
  isLoading: boolean;
}

const trendConfig = {
  rising: {
    label: "Rising",
    icon: TrendingUp,
    iconColor: "text-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    areaColor: "#10b981",
    areaFill: "rgba(16,185,129,0.15)",
    border: "border-emerald-200/50",
    emoji: "🚀",
  },
  stable: {
    label: "Stable",
    icon: Minus,
    iconColor: "text-blue-400",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    areaColor: "#60a5fa",
    areaFill: "rgba(96,165,250,0.12)",
    border: "border-blue-200/40",
    emoji: "→",
  },
  declining: {
    label: "Declining",
    icon: TrendingDown,
    iconColor: "text-red-500",
    badge: "bg-red-100 text-red-700 border-red-200",
    areaColor: "#ef4444",
    areaFill: "rgba(239,68,68,0.15)",
    border: "border-red-200/60",
    emoji: "⚠️",
  },
};

export default function MenuLifecycleChart({ data, isLoading }: MenuLifecycleChartProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-36 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <span className="text-sm font-semibold">Insufficient weekly data</span>
        <span className="text-xs text-center max-w-xs font-body">
          At least 2 weeks of review history needed per item to compute lifecycle trends.
        </span>
      </div>
    );
  }

  const declining = data.filter((d) => d.trend === "declining").length;
  const rising = data.filter((d) => d.trend === "rising").length;

  return (
    <div className="space-y-4">
      {/* Summary pills */}
      <div className="flex items-center gap-3 flex-wrap">
        {declining > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 border border-red-200">
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-semibold text-red-700">{declining} Declining</span>
          </div>
        )}
        {rising > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200">
            <Rocket className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700">{rising} Rising</span>
          </div>
        )}
        <span className="text-xs text-muted-foreground font-body ml-auto hidden sm:block">
          Momentum = avg positive% (last 2 weeks) minus avg positive% (prior 2 weeks)
        </span>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item) => {
          const cfg = trendConfig[item.trend];
          const Icon = cfg.icon;
          const momentumSign = item.momentum > 0 ? "+" : "";

          // Prepare sparkline data
          const sparkData = item.weeks.map((w) => ({ week: w.week, value: w.positiveRatio }));

          return (
            <div
              key={item.name}
              className={`p-4 rounded-xl border ${cfg.border} bg-card/60 hover:shadow-md transition-all`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground font-body truncate">{item.name}</h4>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">
                    {item.totalMentions} mention{item.totalMentions !== 1 ? "s" : ""} · {item.weeks.length} weeks
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ml-2 shrink-0 flex items-center gap-1 ${cfg.badge}`}>
                  <Icon className={`w-3 h-3 ${cfg.iconColor}`} />
                  {cfg.label}
                </span>
              </div>

              {/* Sparkline */}
              <div className="h-16 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <defs>
                      <linearGradient id={`grad-${item.name.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={cfg.areaColor} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={cfg.areaColor} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{ fontSize: "10px", borderRadius: "6px", padding: "4px 8px" }}
                      formatter={(v: number) => [`${v}%`, "Positive"]}
                      labelFormatter={(l) => `Week: ${l}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={cfg.areaColor}
                      strokeWidth={2}
                      fill={`url(#grad-${item.name.replace(/\s+/g, "")})`}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Footer stats */}
              <div className="flex items-center justify-between mt-2 text-xs font-body">
                <span className="text-muted-foreground">
                  Now: <span className="font-semibold text-foreground">{item.currentPositiveRatio}%</span> positive
                </span>
                <span className={`font-bold ${item.momentum > 0 ? "text-emerald-600" : item.momentum < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                  {momentumSign}{item.momentum}% momentum
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
