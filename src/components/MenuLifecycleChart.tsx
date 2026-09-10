import { useState } from "react";
import { MenuLifecycleItem, Review } from "@/services/api";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Rocket, Sparkles, ChefHat, Loader2, Utensils, CheckCircle2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { diagnoseCulinaryIssue, CulinaryDiagnosis } from "@/services/geminiService";
import { toast } from "sonner";

interface MenuLifecycleChartProps {
  data: MenuLifecycleItem[];
  isLoading: boolean;
  reviews?: Review[];
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

export default function MenuLifecycleChart({ data, isLoading, reviews = [] }: MenuLifecycleChartProps) {
  const [selectedDish, setSelectedDish] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<CulinaryDiagnosis | null>(null);

  const handleDiagnose = async (dishName: string) => {
    setSelectedDish(dishName);
    setDiagnosis(null);
    setIsDiagnosing(true);
    try {
      const result = await diagnoseCulinaryIssue(dishName, reviews);
      setDiagnosis(result);
    } catch (err) {
      console.error("Culinary diagnosis failed:", err);
      toast.error("Failed to generate culinary diagnosis. Please try again.");
    } finally {
      setIsDiagnosing(false);
    }
  };

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
          Select &quot;Kitchen Diagnosis&quot; to inspect back-of-house cooking adjustments
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
              className={`p-4 rounded-xl border ${cfg.border} bg-card/60 hover:shadow-md transition-all flex flex-col justify-between`}
            >
              <div>
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
                    {momentumSign}{item.momentum}%
                  </span>
                </div>
              </div>

              {/* AI Recipe Diagnostic Trigger */}
              <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <ChefHat className="w-3.5 h-3.5 text-primary" />
                  Recipe Health
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDiagnose(item.name)}
                  className="h-7 text-xs px-2.5 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 gap-1 font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Recipe Diagnosis</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recipe Diagnosis Dialog */}
      <Dialog open={!!selectedDish} onOpenChange={(open) => !open && setSelectedDish(null)}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <ChefHat className="w-5 h-5" />
              <DialogTitle className="font-display text-lg">
                Back-of-House Culinary Diagnostic
              </DialogTitle>
            </div>
            <DialogDescription className="font-body text-xs text-muted-foreground">
              Sensory root-cause analysis &amp; line-cook adjustments for <strong>{selectedDish}</strong> via Gemini 3.6 Flash
            </DialogDescription>
          </DialogHeader>

          {isDiagnosing ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              <p className="font-body text-sm text-foreground font-medium">
                Reviewing sensory complaints and sauce/protein reduction logs...
              </p>
              <p className="text-xs text-muted-foreground">Synthesizing kitchen prep directive via Gemini</p>
            </div>
          ) : diagnosis ? (
            <div className="space-y-4 py-2 font-body text-xs">
              {/* Diagnosis Summary */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-800 dark:text-amber-300 text-xs flex items-center gap-1.5">
                    <Utensils className="w-4 h-4" />
                    Culinary Science Diagnosis
                  </span>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
                    {diagnosis.estimatedSatisfactionRebound}
                  </span>
                </div>
                <p className="text-foreground leading-relaxed">
                  {diagnosis.culinaryDiagnosis}
                </p>
              </div>

              {/* Identified Sensory Flaws */}
              {diagnosis.sensoryFlawsIdentified?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-foreground text-xs">Identified Sensory Red Flags:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {diagnosis.sensoryFlawsIdentified.map((flaw, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-[11px] font-medium border border-red-200 dark:border-red-900/50">
                        • {flaw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Line Cook Adjustments */}
              <div className="space-y-2">
                <span className="font-semibold text-foreground text-xs flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  Line Cook &amp; Kitchen Directives:
                </span>
                
                <div className="grid grid-cols-1 gap-2">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Prep Station Adjustment</span>
                    <p className="text-foreground">{diagnosis.kitchenLineFix.prepAdjustment}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Cook Time / Pan Temperature</span>
                    <p className="text-foreground">{diagnosis.kitchenLineFix.cookTimeOrTemp}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Plating &amp; Seasoning Finish</span>
                    <p className="text-foreground">{diagnosis.kitchenLineFix.seasoningFinishing}</p>
                  </div>
                </div>
              </div>

              {/* Service Expediting Directive */}
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase block mb-0.5">Floor Expediting Directive</span>
                <p className="text-blue-900 dark:text-blue-200 leading-relaxed">{diagnosis.serviceDirective}</p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    toast.success(`Recipe directive for ${selectedDish} logged to kitchen clipboard!`);
                    setSelectedDish(null);
                  }}
                  className="text-xs gradient-amber text-white font-semibold gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Send to Kitchen Board</span>
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
