import { useState } from "react";
import { ChurnRisk } from "@/services/api";
import { ShieldCheck, Clock, Star, User, Sparkles, Loader2, Copy, Check, Send, AlertCircle, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { generateWinBackCampaign, WinBackCampaign } from "@/services/geminiService";
import { toast } from "sonner";

interface ChurnWarningPanelProps {
  data: ChurnRisk[];
  isLoading: boolean;
  restaurantName?: string;
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

export default function ChurnWarningPanel({ data, isLoading, restaurantName = "The Golden Fork" }: ChurnWarningPanelProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<ChurnRisk | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaign, setCampaign] = useState<WinBackCampaign | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleOpenWinBack = async (customer: ChurnRisk) => {
    setSelectedCustomer(customer);
    setCampaign(null);
    setIsGenerating(true);
    try {
      const result = await generateWinBackCampaign(customer, restaurantName);
      setCampaign(result);
    } catch (err) {
      console.error("Failed to generate winback campaign:", err);
      toast.error("Failed to generate AI recovery campaign. Please check your network connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = () => {
    if (!campaign) return;
    navigator.clipboard.writeText(campaign.personalizedMessage);
    setIsCopied(true);
    toast.success("Recovery message copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

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
          Click &quot;Win-Back&quot; to generate an autonomous guest recovery plan
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

                  <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[140px] flex items-center gap-2">
                      <div className={`flex-1 h-2 rounded-full ${cfg.trackColor} overflow-hidden`}>
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${cfg.barColor}`}
                          style={{ width: `${customer.churnScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground font-body shrink-0">
                        Score: {customer.churnScore}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenWinBack(customer)}
                      className="text-xs font-medium border-amber-500/40 hover:bg-amber-500/10 text-amber-800 dark:text-amber-300 gap-1.5 h-7 px-2.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Draft Win-Back</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Win-Back Campaign Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <Sparkles className="w-5 h-5" />
              <DialogTitle className="font-display text-lg">
                AI Churn Win-Back Campaign
              </DialogTitle>
            </div>
            <DialogDescription className="font-body text-xs text-muted-foreground">
              Personalized retention offer for <strong>{selectedCustomer?.customerName}</strong> powered by Gemini 3.6 Flash
            </DialogDescription>
          </DialogHeader>

          {isGenerating ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              <p className="font-body text-sm text-foreground font-medium">
                Analyzing guest complaints & calculating psychological recovery offer...
              </p>
              <p className="text-xs text-muted-foreground">Synthesizing personalized outreach via Gemini</p>
            </div>
          ) : campaign ? (
            <div className="space-y-4 py-2 font-body text-sm">
              {/* Grievance summary */}
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">
                    Core Grievance Isolated
                  </div>
                  <div className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                    {campaign.specificGrievance}
                  </div>
                </div>
              </div>

              {/* Personalized Outreach */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Direct Outreach Message ({campaign.recommendedChannel})</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyMessage}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {isCopied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="p-3.5 rounded-lg bg-muted/40 border border-border text-xs leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                  {campaign.personalizedMessage}
                </div>
              </div>

              {/* Recovery Offer */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <Gift className="w-4 h-4" />
                    <span>{campaign.recoveryOffer.title}</span>
                  </div>
                  <span className="text-[11px] font-mono bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">
                    {campaign.recoveryOffer.suggestedPromoCode}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {campaign.recoveryOffer.description}
                </p>
              </div>

              {/* Rationale */}
              <div className="p-3 rounded-lg bg-background/50 border border-border/60 text-xxs text-muted-foreground space-y-1">
                <span className="font-semibold text-foreground text-xs block">Behavioral Conversion Rationale:</span>
                <p className="leading-relaxed">{campaign.conversionRationale}</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    handleCopyMessage();
                    setSelectedCustomer(null);
                  }}
                  className="text-xs gradient-amber text-white font-semibold gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  <span>Copy &amp; Launch Outreach</span>
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
