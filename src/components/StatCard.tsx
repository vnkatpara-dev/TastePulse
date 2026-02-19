import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  className?: string;
}

const StatCard = ({ title, value, icon, subtitle, className }: StatCardProps) => (
  <div className={cn("glass-card rounded-xl p-6 animate-fade-in", className)}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground font-body">{title}</p>
        <p className="text-3xl font-bold font-display mt-1 text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground font-body mt-1">{subtitle}</p>}
      </div>
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
    </div>
  </div>
);

export default StatCard;
