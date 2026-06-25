import { CompetitorBenchmarkItem } from "@/services/api";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend
} from "recharts";
import { Trophy, Medal } from "lucide-react";

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

export default function CompetitorBenchmark({ data, selectedRestaurantName, isLoading }: CompetitorBenchmarkProps) {
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
    </div>
  );
}
