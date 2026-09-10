import { useState } from "react";
import { CompetitorBenchmarkItem } from "@/services/api";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend
} from "recharts";
import { Trophy, Medal, Swords, Sparkles, Loader2, Target, CheckCircle, TrendingUp, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { generateCompetitorExploitStrategy, CompetitorExploitStrategy } from "@/services/geminiService";
import { toast } from "sonner";

interface CompetitorBenchmarkProps {
  data: CompetitorBenchmarkItem[];
  selectedRestaurantName?: string;
  isLoading: boolean;
}

const RESTAURANT_COLORS = [
  "hsl(36,95%,55%)",
  "hsl(210,80%,60%)",
  "hsl(160,60%,45%)",
  "hsl(280,60%,60%)",
  "hsl(0,65%,55%)",
];

const DIMENSION_LABELS: Record<string, string> = {
  foodQuality: "Food Quality",
  service: "Service",
  hygiene: "Hygiene",
  value: "Value",
  ambiance: "Ambiance",
};

export default function CompetitorBenchmark({ data, selectedRestaurantName = "The Golden Fork", isLoading }: CompetitorBenchmarkProps) {
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategies, setStrategies] = useState<CompetitorExploitStrategy[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleOpenPlaybook = async () => {
    setIsStrategyOpen(true);
    if (strategies.length > 0) return; // already loaded
    setIsGenerating(true);
    try {
      const result = await generateCompetitorExploitStrategy(selectedRestaurantName, data);
      setStrategies(result);
    } catch (err) {
      console.error("Failed to generate competitor strategy:", err);
      toast.error("Failed to generate competitive playbook. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyStrategy = (strat: CompetitorExploitStrategy, idx: number) => {
    const text = `CAMPAIGN: ${strat.offensiveCampaignTitle}\nTarget: ${strat.targetCompetitor}\nExploited Weakness: ${strat.competitorWeakness}\nOur Advantage: ${strat.ourAdvantage}\nTactical Move: ${strat.tacticalAction}\nPromo Angle: ${strat.promotionalAngle}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success("Campaign brief copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (isLoading) {
    return <div className="h-80 rounded-xl bg-muted/30 animate-pulse" />;
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
        <Trophy className="w-10 h-10 text-amber-400" />
        <span className="text-sm font-semibold">No competitor data available</span>
        <span className="text-xs font-body">Add more restaurants to compare performance.</span>
      </div>
    );
  }

  // Build radar data: one point per dimension
  const radarData = ["foodQuality", "service", "hygiene", "value", "ambiance"].map((dim) => {
    const point: Record<string, string | number> = { dimension: DIMENSION_LABELS[dim] };
    data.forEach((r) => {
      point[r.name] = r.dimensions[dim as keyof typeof r.dimensions];
    });
    return point;
  });

  // Winner per dimension
  const dimensionWinners: Record<string, string> = {};
  ["foodQuality", "service", "hygiene", "value", "ambiance"].forEach((dim) => {
    let best = data[0];
    data.forEach((r) => {
      if (r.dimensions[dim as keyof typeof r.dimensions] > best.dimensions[dim as keyof typeof best.dimensions]) {
        best = r;
      }
    });
    dimensionWinners[dim] = best.name;
  });

  return (
    <div className="space-y-6">
      {/* Action header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-border/40">
        <div className="text-xs text-muted-foreground font-body">
          Cross-restaurant radar analysis across 5 dimensions. Compare metrics and exploit competitor service gaps.
        </div>
        <Button
          onClick={handleOpenPlaybook}
          size="sm"
          className="text-xs gradient-amber text-white font-semibold gap-1.5 shadow-sm"
        >
          <Swords className="w-3.5 h-3.5" />
          <span>Generate Offensive Playbook</span>
        </Button>
      </div>

      {/* Radar chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="hsl(30,15%,85%)" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 12, fontFamily: "Inter", fill: "hsl(30,5%,45%)" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "hsl(30,5%,55%)" }}
              tickCount={5}
            />
            <Tooltip
              contentStyle={{ borderRadius: "8px", fontFamily: "Inter", fontSize: "12px" }}
              formatter={(v: number) => [`${v}%`]}
            />
            <Legend wrapperStyle={{ fontFamily: "Inter", fontSize: "12px" }} />
            {data.map((restaurant, idx) => (
              <Radar
                key={restaurant.name}
                name={restaurant.name}
                dataKey={restaurant.name}
                stroke={RESTAURANT_COLORS[idx % RESTAURANT_COLORS.length]}
                fill={RESTAURANT_COLORS[idx % RESTAURANT_COLORS.length]}
                fillOpacity={restaurant.name === selectedRestaurantName ? 0.25 : 0.08}
                strokeWidth={restaurant.name === selectedRestaurantName ? 2.5 : 1.5}
                strokeDasharray={restaurant.name === selectedRestaurantName ? undefined : "4 2"}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table */}
      <div className="overflow-x-auto rounded-xl border border-border/50">
        <table className="w-full text-xs font-body">
          <thead>
            <tr className="bg-muted/30 border-b border-border/50">
              <th className="text-left px-4 py-3 font-semibold text-foreground">Restaurant</th>
              <th className="text-center px-3 py-3 font-semibold text-foreground">Food</th>
              <th className="text-center px-3 py-3 font-semibold text-foreground">Service</th>
              <th className="text-center px-3 py-3 font-semibold text-foreground">Hygiene</th>
              <th className="text-center px-3 py-3 font-semibold text-foreground">Value</th>
              <th className="text-center px-3 py-3 font-semibold text-foreground">Ambiance</th>
              <th className="text-center px-3 py-3 font-semibold text-foreground">Overall</th>
            </tr>
          </thead>
          <tbody>
            {data.map((restaurant, idx) => {
              const isSelected = restaurant.name === selectedRestaurantName;
              const rank = idx + 1;
              return (
                <tr
                  key={restaurant.name}
                  className={`border-b border-border/30 transition-colors ${isSelected ? "bg-amber-50/60" : "hover:bg-muted/20"}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {rank === 1 ? (
                        <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : rank === 2 ? (
                        <Medal className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <span className="w-4 h-4 text-center text-muted-foreground shrink-0 text-[10px] font-bold">#{rank}</span>
                      )}
                      <div>
                        <span className={`font-semibold ${isSelected ? "text-amber-700" : "text-foreground"}`}>
                          {restaurant.name}
                          {isSelected && <span className="ml-1 text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">YOU</span>}
                        </span>
                        <p className="text-muted-foreground text-[10px]">{restaurant.cuisine} · {restaurant.totalReviews} reviews</p>
                      </div>
                    </div>
                  </td>
                  {(["foodQuality", "service", "hygiene", "value", "ambiance"] as const).map((dim) => {
                    const score = restaurant.dimensions[dim];
                    const isWinner = dimensionWinners[dim] === restaurant.name;
                    return (
                      <td key={dim} className="text-center px-3 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded font-bold ${
                          isWinner
                            ? "bg-amber-100 text-amber-700"
                            : score >= 70
                            ? "text-emerald-700"
                            : score >= 50
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}>
                          {score}%
                        </span>
                      </td>
                    );
                  })}
                  <td className="text-center px-3 py-3">
                    <span className="font-bold text-foreground">{restaurant.overallScore}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend: dimension winners */}
      <div className="flex items-center flex-wrap gap-2 text-xs font-body text-muted-foreground">
        <span className="font-semibold text-foreground">Category leaders:</span>
        {Object.entries(dimensionWinners).map(([dim, winner]) => (
          <span key={dim} className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-amber-800">
            <Trophy className="w-3 h-3 text-amber-500" />
            <span className="font-semibold">{DIMENSION_LABELS[dim]}:</span> {winner}
          </span>
        ))}
      </div>

      {/* Competitor Exploitation Playbook Dialog */}
      <Dialog open={isStrategyOpen} onOpenChange={setIsStrategyOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <Swords className="w-5 h-5" />
              <DialogTitle className="font-display text-lg">
                Competitor Vulnerability Exploitation Playbook
              </DialogTitle>
            </div>
            <DialogDescription className="font-body text-xs text-muted-foreground">
              Offensive marketing moves to capture market share from local competitors based on benchmark deltas
            </DialogDescription>
          </DialogHeader>

          {isGenerating ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              <p className="font-body text-sm text-foreground font-medium">
                Auditing competitor weaknesses vs. {selectedRestaurantName}&apos;s strengths...
              </p>
              <p className="text-xs text-muted-foreground">Generating growth-hacking playbook via Gemini 3.6 Flash</p>
            </div>
          ) : strategies.length > 0 ? (
            <div className="space-y-4 py-2 font-body text-xs">
              {strategies.map((strat, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-card/70 space-y-2.5 hover:border-amber-500/50 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 inline-block mb-1">
                        Target: {strat.targetCompetitor}
                      </span>
                      <h4 className="font-display font-bold text-sm text-foreground">
                        {strat.offensiveCampaignTitle}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {strat.expectedMarketShareGain}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyStrategy(strat, idx)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        title="Copy Campaign Brief"
                      >
                        {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 text-red-900 dark:text-red-300">
                      <span className="font-bold block text-[10px] uppercase text-red-700 dark:text-red-400">Their Vulnerability</span>
                      {strat.competitorWeakness}
                    </div>
                    <div className="p-2 rounded bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 text-emerald-900 dark:text-emerald-300">
                      <span className="font-bold block text-[10px] uppercase text-emerald-700 dark:text-emerald-400">Our Strategic Advantage</span>
                      {strat.ourAdvantage}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                      <span className="font-bold text-[10px] text-muted-foreground uppercase block mb-0.5">Tactical Action:</span>
                      <p className="text-foreground leading-relaxed">{strat.tacticalAction}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-50/30 border border-amber-200/40">
                      <span className="font-bold text-[10px] text-amber-800 dark:text-amber-300 uppercase block mb-0.5">Marketing Hook &amp; Angle:</span>
                      <p className="text-foreground italic leading-relaxed">&ldquo;{strat.promotionalAngle}&rdquo;</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-xs">
              No competitor strategies found.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
