import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { MessageSquare, TrendingUp, ThumbsUp, ThumbsDown, LogOut, Star, Loader2, Plus, Pencil, Trash2, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatCard from "@/components/StatCard";
import SentimentBadge from "@/components/SentimentBadge";
import StarRating from "@/components/StarRating";
import { getAnalytics, getReviews, getSentimentTrend, getCategoryBreakdown, getRestaurants, addRestaurant, deleteRestaurant, updateRestaurant, Review, Analytics, SentimentTrend, CategoryBreakdown, Restaurant } from "@/services/api";

const COLORS = {
  positive: "hsl(142, 72%, 40%)",
  negative: "hsl(0, 72%, 51%)",
  neutral: "hsl(36, 80%, 50%)",
};

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [sentimentTrend, setSentimentTrend] = useState<SentimentTrend[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantCuisine, setRestaurantCuisine] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selected restaurant state
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [analyticsData, reviewsData, trendData, categoryData, restaurantsData] = await Promise.all([
          getAnalytics(),
          getReviews(),
          getSentimentTrend(),
          getCategoryBreakdown(),
          getRestaurants()
        ]);
        setAnalytics(analyticsData);
        setReviews(reviewsData);
        setSentimentTrend(trendData);
        setCategoryBreakdown(categoryData);
        setRestaurants(restaurantsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data based on selected restaurant
  const filteredReviews = selectedRestaurant 
    ? reviews.filter(r => r.restaurantName === selectedRestaurant.name)
    : reviews;

  const filteredAnalytics = selectedRestaurant ? {
    totalReviews: filteredReviews.length,
    positive: filteredReviews.filter(r => r.sentiment === 'positive').length,
    negative: filteredReviews.filter(r => r.sentiment === 'negative').length,
    neutral: filteredReviews.filter(r => r.sentiment === 'neutral').length,
    positivePercent: filteredReviews.length > 0 
      ? Math.round((filteredReviews.filter(r => r.sentiment === 'positive').length / filteredReviews.length) * 100 * 10) / 10 
      : 0,
    negativePercent: filteredReviews.length > 0 
      ? Math.round((filteredReviews.filter(r => r.sentiment === 'negative').length / filteredReviews.length) * 100 * 10) / 10 
      : 0,
    averageRating: filteredReviews.length > 0 
      ? Math.round(filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length * 10) / 10 
      : 0
  } : analytics;

  const filteredPieData = [
    { name: "Positive", value: filteredAnalytics?.positive || 0, color: COLORS.positive },
    { name: "Negative", value: filteredAnalytics?.negative || 0, color: COLORS.negative },
    { name: "Neutral", value: filteredAnalytics?.neutral || 0, color: COLORS.neutral },
  ];

  const handleAddRestaurant = () => {
    setEditingRestaurant(null);
    setRestaurantName("");
    setRestaurantCuisine("");
    setIsDialogOpen(true);
  };

  const handleEditRestaurant = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setRestaurantName(restaurant.name);
    setRestaurantCuisine(restaurant.cuisine);
    setIsDialogOpen(true);
  };

  const handleDeleteRestaurant = async (restaurantId: string) => {
    if (window.confirm("Are you sure you want to delete this restaurant? All associated reviews will also be deleted.")) {
      try {
        await deleteRestaurant(restaurantId);
        // Refresh restaurants list
        const restaurantsData = await getRestaurants();
        setRestaurants(restaurantsData);
        // Refresh analytics and reviews
        const [analyticsData, reviewsData] = await Promise.all([
          getAnalytics(),
          getReviews()
        ]);
        setAnalytics(analyticsData);
        setReviews(reviewsData);
        // Clear selection if deleted restaurant was selected
        if (selectedRestaurant?.id === restaurantId) {
          setSelectedRestaurant(null);
        }
      } catch (error) {
        console.error("Failed to delete restaurant:", error);
      }
    }
  };

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    if (selectedRestaurant?.id === restaurant.id) {
      // Deselect if clicking on already selected
      setSelectedRestaurant(null);
    } else {
      setSelectedRestaurant(restaurant);
    }
  };

  const handleSubmitRestaurant = async () => {
    if (!restaurantName.trim() || !restaurantCuisine.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRestaurant) {
        // Update existing restaurant
        await updateRestaurant(editingRestaurant.id, {
          name: restaurantName,
          cuisine: restaurantCuisine
        });
      } else {
        // Add new restaurant
        await addRestaurant({
          name: restaurantName,
          cuisine: restaurantCuisine
        });
      }
      
      // Refresh restaurants list
      const restaurantsData = await getRestaurants();
      setRestaurants(restaurantsData);
      
      // Close dialog
      setIsDialogOpen(false);
      setRestaurantName("");
      setRestaurantCuisine("");
      setEditingRestaurant(null);
    } catch (error) {
      console.error("Failed to save restaurant:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h1 className="font-display text-2xl font-bold text-foreground">
              {selectedRestaurant ? selectedRestaurant.name : "Sentiment Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground font-body">
              {selectedRestaurant ? `${selectedRestaurant.cuisine} · Owner View` : "The Golden Fork · Owner View"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedRestaurant && (
              <Button variant="outline" size="sm" onClick={() => setSelectedRestaurant(null)} className="font-body">
                <X className="w-4 h-4 mr-2" /> View All
              </Button>
            )}
            <Button variant="default" size="sm" onClick={handleAddRestaurant} className="font-body">
              <Plus className="w-4 h-4 mr-2" /> Add Restaurant
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground font-body">
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Reviews" 
            value={filteredAnalytics?.totalReviews?.toString() || "0"} 
            icon={<MessageSquare className="w-5 h-5" />} 
            subtitle={selectedRestaurant ? "Restaurant data" : "Live data"} 
          />
          <StatCard 
            title="Avg. Rating" 
            value={filteredAnalytics?.averageRating?.toString() || "0"} 
            icon={<Star className="w-5 h-5" />} 
            subtitle="Out of 5.0" 
          />
          <StatCard 
            title="Positive" 
            value={`${filteredAnalytics?.positivePercent || 0}%`} 
            icon={<ThumbsUp className="w-5 h-5" />} 
            subtitle={`${filteredAnalytics?.positive || 0} reviews`} 
          />
          <StatCard 
            title="Negative" 
            value={`${filteredAnalytics?.negativePercent || 0}%`} 
            icon={<ThumbsDown className="w-5 h-5" />} 
            subtitle={`${filteredAnalytics?.negative || 0} reviews`} 
          />
        </div>

        {/* Restaurants Management */}
        <div className="glass-card rounded-xl p-6 animate-fade-in">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">
            {selectedRestaurant ? "Restaurant Details" : "My Restaurants"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map((restaurant) => (
              <div 
                key={restaurant.id} 
                onClick={() => handleSelectRestaurant(restaurant)}
                className={`flex items-center justify-between p-4 rounded-lg bg-background/50 border cursor-pointer transition-all hover:shadow-md ${
                  selectedRestaurant?.id === restaurant.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border/50 hover:border-primary/50"
                }`}
              >
                <div className="flex-1">
                  <h4 className="font-medium text-foreground font-body">{restaurant.name}</h4>
                  <p className="text-sm text-muted-foreground font-body">{restaurant.cuisine}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-3 h-3 text-amber-500" />
                    <span className="text-xs text-muted-foreground font-body">
                      {restaurant.sentimentSummary?.averageRating?.toFixed(1) || "0.0"} ({restaurant.sentimentSummary?.total || 0} reviews)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => handleEditRestaurant(restaurant)} className="text-muted-foreground hover:text-foreground">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteRestaurant(restaurant.id)} className="text-muted-foreground hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {restaurants.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No restaurants yet. Click "Add Restaurant" to get started.
              </div>
            )}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sentiment Trend */}
          <div className="lg:col-span-2 glass-card rounded-xl p-6 animate-fade-in">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              {selectedRestaurant ? `${selectedRestaurant.name} - Sentiment Trend` : "Sentiment Trend"}
            </h3>
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
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              {selectedRestaurant ? `${selectedRestaurant.name} - Sentiment Split` : "Sentiment Split"}
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={filteredPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {filteredPieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", fontFamily: "Inter" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {filteredPieData.map((entry) => (
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
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">
            {selectedRestaurant ? `${selectedRestaurant.name} - Category Breakdown` : "Category Breakdown"}
          </h3>
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
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">
            {selectedRestaurant ? `${selectedRestaurant.name} - Recent Reviews` : "Recent Reviews"}
          </h3>
          <div className="space-y-4">
            {filteredReviews.slice(0, 6).map((review) => (
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
            {filteredReviews.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {selectedRestaurant 
                  ? `No reviews yet for ${selectedRestaurant.name}` 
                  : "No reviews yet"}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Restaurant Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingRestaurant ? "Edit Restaurant" : "Add New Restaurant"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right font-body">
                Name
              </Label>
              <Input
                id="name"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="col-span-3 font-body"
                placeholder="Restaurant name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cuisine" className="text-right font-body">
                Cuisine
              </Label>
              <Input
                id="cuisine"
                value={restaurantCuisine}
                onChange={(e) => setRestaurantCuisine(e.target.value)}
                className="col-span-3 font-body"
                placeholder="e.g., Italian, Chinese, Mexican"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleSubmitRestaurant} 
              disabled={isSubmitting}
              className="font-body"
            >
              {isSubmitting ? "Saving..." : editingRestaurant ? "Save Changes" : "Add Restaurant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerDashboard;
