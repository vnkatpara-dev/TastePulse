import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { MessageSquare, TrendingUp, ThumbsUp, ThumbsDown, LogOut, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/StatCard";
import SentimentBadge from "@/components/SentimentBadge";
import StarRating from "@/components/StarRating";
import { getAnalytics, getReviews, getSentimentTrend, getCategoryBreakdown, Review, Analytics, SentimentTrend, CategoryBreakdown } from "@/services/api";

const COLORS = {
  positive: "hsl(142, 72%, 40%)",
  negative: "hsl(0, 72%, 51%)",
  neutral: "hsl(36, 80%, 50%)",
};

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sentimentTrend, setSentimentTrend] = useState<SentimentTrend[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [analyticsData, reviewsData, trendData, categoryData] = await Promise.all([
          getAnalytics(),
          getReviews(),
          getSentimentTrend(),
          getCategoryBreakdown()
        ]);
        setAnalytics(analyticsData);
        setReviews(reviewsData);
        setSentimentTrend(trendData);
        setCategoryBreakdown(categoryData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Transform analytics for pie chart
  const pieData = analytics ? [
    { name: "Positive", value: analytics.positive, color: COLORS.positive },
    { name: "Negative", value: analytics.negative, color: COLORS.negative },
    { name: "Neutral", value: analytics.neutral, color: COLORS.neutral },
  ] : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <StatCard 
            title="Total Reviews" 
            value={analytics?.totalReviews?.toString() || "0"} 
            icon={<MessageSquare className="w-5 h-5" />} 
            subtitle="Live data" 
          />
          <StatCard 
            title="Avg. Rating" 
            value={analytics?.averageRating?.toString() || "0"} 
            icon={<Star className="w-5 h-5" />} 
            subtitle="Out of 5.0" 
          />
          <StatCard 
            title="Positive" 
            value={`${analytics?.positivePercent || 0}%`} 
            icon={<ThumbsUp className="w-5 h-5" />} 
            subtitle={`${analytics?.positive || 0} reviews`} 
          />
          <StatCard 
            title="Negative" 
            value={`${analytics?.negativePercent || 0}%`} 
            icon={<ThumbsDown className="w-5 h-5" />} 
            subtitle={`${analytics?.negative || 0} reviews`} 
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sentiment Trend */}
          <div className="lg:col-span-2 glass-card rounded-xl p-6 animate-fade-in">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Sentiment Trend</h3>
            {sentimentTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sentimentTrend}>
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
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
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
          {categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
                <XAxis type="number" stroke="hsl(30, 5%, 45%)" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="hsl(30, 5%, 45%)" fontSize={12} width={100} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontFamily: "Inter" }} />
                <Bar dataKey="positive" fill={COLORS.positive} radius={[0, 4, 4, 0]} />
                <Bar dataKey="negative" fill={COLORS.negative} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              No category data available
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="glass-card rounded-xl p-6 animate-fade-in">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Reviews</h3>
          <div className="space-y-4">
            {reviews.slice(0, 6).map((review) => (
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
