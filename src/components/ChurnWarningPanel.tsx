import { ChurnRisk } from "@/services/api";
import { ShieldCheck, Clock, Star, User } from "lucide-react";

interface ChurnWarningPanelProps {
  data: ChurnRisk[];
  isLoading: boolean;
}

const riskConfig = {
  high: {
    label: "HIGH RISK",
    barColor: "bg-red-500",
    trackColor: "bg-red-100",
    badge: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500 animate-pulse",
    border: "border-red-200/60",
    bg: "bg-red-50/40",
  },
  medium: {
    label: "MEDIUM",
    barColor: "bg-amber-400",
    trackColor: "bg-amber-100",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
    border: "border-amber-200/60",
    bg: "bg-amber-50/30",
  },
  low: {
    label: "LOW",
    barColor: "bg-emerald-400",
    trackColor: "bg-emerald-100",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-400",
    border: "border-emerald-200/40",
    bg: "bg-emerald-50/20",
  },
};

const StarMini = ({ rating }: { rating: number }) => (
  <span className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`w-3 h-3 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-muted/40"}`}
      />
    ))}
  </span>
);

export default function ChurnWarningPanel({ data, isLoading }: ChurnWarningPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3 text-emerald-600">
        <ShieldCheck className="w-12 h-12 text-emerald-500" />
        <span className="font-semibold text-sm">No Churn Risks Detected</span>
        <span className="text-xs text-muted-foreground font-body text-center max-w-xs">
          All recent customers are within healthy return windows.
        </span>
      </div>
    );
  }

  const high = data.filter((d) => d.riskLevel === "high").length;
  const medium = data.filter((d) => d.riskLevel === "medium").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 border border-red-200">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-semibold text-red-700">{high} High Risk</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs font-semibold text-amber-700">{medium} Medium Risk</span>
        </div>
        <span className="text-xs text-muted-foreground font-body ml-auto hidden sm:block">
          Score = rating gap + sentiment penalty + log(days since visit)
        </span>
      </div>
      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
        {data.map((customer) => {
          const cfg = riskConfig[customer.riskLevel];
          return (
            <div
              key={customer.customerName}
              className={`p-4 rounded-xl border ${cfg.border} ${cfg.bg} transition-all hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center text-white text-sm font-bold">
                    {customer.customerName.charAt(0)}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${cfg.dot}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground font-body">{customer.customerName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold tracking-wider ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-body">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{customer.daysSinceVisit}d ago</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{customer.totalReviews} visit{customer.totalReviews !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <StarMini rating={customer.lastRating} />
                    <span className="text-xs text-muted-foreground font-body truncate max-w-xs italic">
                      &quot;{customer.lastReviewText.slice(0, 70)}{customer.lastReviewText.length > 70 ? "..." : ""}&quot;
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className={`flex-1 h-2 rounded-full ${cfg.trackColor} overflow-hidden`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${cfg.barColor}`}
                        style={{ width: `${customer.churnScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground font-body shrink-0 w-16 text-right">
                      Score: {customer.churnScore}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
