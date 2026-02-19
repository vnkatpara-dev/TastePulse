import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { MessageSquare, TrendingUp, ThumbsUp, ThumbsDown, LogOut, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/StatCard";
import SentimentBadge from "@/components/SentimentBadge";
import StarRating from "@/components/StarRating";
import { mockReviews, sentimentTrendData, categoryData } from "@/data/mockData";

const COLORS = {
  positive: "hsl(142, 72%, 40%)",
  negative: "hsl(0, 72%, 51%)",
  neutral: "hsl(36, 80%, 50%)",
};

const pieData = [
  { name: "Positive", value: 370, color: COLORS.positive },
  { name: "Negative", value: 92, color: COLORS.negative },
  { name: "Neutral", value: 117, color: COLORS.neutral },
];

const OwnerDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Sentiment Dashboard</h1>
            <p className="text-sm text-muted-foreground font-body">The Golden Fork · Owner View</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground font-body">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Reviews" value="579" icon={<MessageSquare className="w-5 h-5" />} subtitle="+23 this week" />
          <StatCard title="Avg. Rating" value="4.1" icon={<Star className="w-5 h-5" />} subtitle="Out of 5.0" />
          <StatCard title="Positive" value="64%" icon={<ThumbsUp className="w-5 h-5" />} subtitle="370 reviews" />
          <StatCard title="Negative" value="16%" icon={<ThumbsDown className="w-5 h-5" />} subtitle="92 reviews" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sentiment Trend */}
          <div className="lg:col-span-2 glass-card rounded-xl p-6 animate-fade-in">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Sentiment Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sentimentTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
                <XAxis dataKey="month" stroke="hsl(30, 5%, 45%)" fontSize={12} />
                <YAxis stroke="hsl(30, 5%, 45%)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(30, 15%, 95%)", border: "1px solid hsl(30, 15%, 88%)", borderRadius: "8px", fontFamily: "Inter" }} />
                <Legend />
                <Line type="monotone" dataKey="positive" stroke={COLORS.positive} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="negative" stroke={COLORS.negative} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="neutral" stroke={COLORS.neutral} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie */}
          <div className="glass-card rounded-xl p-6 animate-fade-in">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Sentiment Split</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", fontFamily: "Inter" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-muted-foreground font-body">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card rounded-xl p-6 animate-fade-in">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Category Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
              <XAxis type="number" stroke="hsl(30, 5%, 45%)" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="hsl(30, 5%, 45%)" fontSize={12} width={100} />
              <Tooltip contentStyle={{ borderRadius: "8px", fontFamily: "Inter" }} />
              <Bar dataKey="positive" fill={COLORS.positive} radius={[0, 4, 4, 0]} />
              <Bar dataKey="negative" fill={COLORS.negative} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Reviews */}
        <div className="glass-card rounded-xl p-6 animate-fade-in">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Reviews</h3>
          <div className="space-y-4">
            {mockReviews.slice(0, 6).map((review) => (
              <div key={review.id} className="flex items-start gap-4 p-4 rounded-lg bg-background/50 border border-border/50">
                <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center text-primary-foreground text-sm font-semibold font-body shrink-0">
                  {review.customerName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground font-body text-sm">{review.customerName}</span>
                    <SentimentBadge sentiment={review.sentiment} />
                    <span className="text-xs text-muted-foreground font-body ml-auto">{review.date}</span>
                  </div>
                  <div className="mt-1">
                    <StarRating rating={review.rating} size={14} />
                  </div>
                  <p className="text-sm text-muted-foreground font-body mt-1 line-clamp-2">{review.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OwnerDashboard;
