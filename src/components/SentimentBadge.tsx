import { cn } from "@/lib/utils";

interface SentimentBadgeProps {
  sentiment: "positive" | "negative" | "neutral";
  className?: string;
}

const SentimentBadge = ({ sentiment, className }: SentimentBadgeProps) => {
  const styles = {
    positive: "bg-success/10 text-success border-success/20",
    negative: "bg-destructive/10 text-destructive border-destructive/20",
    neutral: "bg-warning/10 text-warning border-warning/20",
  };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-body border", styles[sentiment], className)}>
      {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
    </span>
  );
};

export default SentimentBadge;
