import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Send, Star, Loader2, Search, UserCircle2, Sparkles, ArrowRight, Store, Check, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StarRating from "@/components/StarRating";
import SentimentBadge from "@/components/SentimentBadge";
import { Restaurant, Review, getRestaurants, getReviewsByRestaurant, addReview, deleteReview } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const REVIEW_CATEGORIES = [
  "Food Quality",
  "Service",
  "Ambiance",
  "Value",
  "Hygiene",
  "General"
];

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user, isDemo, loginAsDemo, logout } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState("Food Quality");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // TastePulse Restaurant Directory dialog state
  const [isBrowseDirectoryOpen, setIsBrowseDirectoryOpen] = useState(false);
  const [directorySearch, setDirectorySearch] = useState("");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [selectedCuisineFilter, setSelectedCuisineFilter] = useState("all");

  const loadData = async () => {
    try {
      const restaurantsData = await getRestaurants();
      setRestaurants(restaurantsData);
      
      // Preserve current selection or select first
      if (restaurantsData.length > 0) {
        const currentSelected = selectedRestaurant 
          ? restaurantsData.find(r => r.name === selectedRestaurant.name) || restaurantsData[0]
          : restaurantsData[0];
        
        setSelectedRestaurant(currentSelected);
        const reviewsData = await getReviewsByRestaurant(currentSelected.name);
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error("Failed to load restaurants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for live updates across demo sessions
    const handleStoreUpdate = () => {
      getRestaurants().then(updatedList => {
        setRestaurants(updatedList);
        if (selectedRestaurant) {
          getReviewsByRestaurant(selectedRestaurant.name).then(setReviews).catch(console.error);
        }
      }).catch(console.error);
    };

    window.addEventListener('tastepulse_review_store_updated', handleStoreUpdate);
    return () => {
      window.removeEventListener('tastepulse_review_store_updated', handleStoreUpdate);
    };
  }, []);

  const handleRestaurantSelect = async (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    try {
      const reviewsData = await getReviewsByRestaurant(restaurant.name);
      setReviews(reviewsData);
    } catch (error) {
      console.error("Failed to load reviews for restaurant:", error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !reviewText.trim()) {
      toast.error("Please provide a rating and review text");
      return;
    }
    if (!selectedRestaurant) {
      toast.error("Please select a restaurant from the available list");
      return;
    }

    try {
      setIsSubmitting(true);
      const customerDisplayName = user?.displayName || (user?.email ? user.email.split('@')[0] : "Demo Customer");
      
      const newReview = await addReview({
        customerName: customerDisplayName,
        restaurantId: selectedRestaurant.id,
        restaurantName: selectedRestaurant.name,
        rating,
        text: reviewText.trim(),
        category: selectedCategory
      });
      
      toast.success(`Review submitted! AI Sentiment: ${newReview.sentiment.toUpperCase()}`, {
        description: `Your review for ${selectedRestaurant.name} is now live and synchronized to the Owner Dashboard.`
      });

      // Update local state immediately
      setReviews(prev => [newReview, ...prev.filter(r => r.id !== newReview.id)]);
      setReviewText("");
      setRating(5);
      
      // Reload restaurants to refresh aggregates
      const updatedRestaurants = await getRestaurants();
      setRestaurants(updatedRestaurants);
      const updatedCurrent = updatedRestaurants.find(r => r.name === selectedRestaurant.name);
      if (updatedCurrent) {
        setSelectedRestaurant(updatedCurrent);
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await deleteReview(reviewId);
        toast.success("Review deleted successfully");
        setReviews(prev => prev.filter(r => r.id !== reviewId));
        const updated = await getRestaurants();
        setRestaurants(updated);
      } catch (error) {
        console.error("Failed to delete review:", error);
        toast.error("Failed to delete review");
      }
    }
  };

  const handleSwitchToOwner = async () => {
    try {
      await loginAsDemo("owner");
      toast.success("Switched to Restaurant Owner Dashboard");
      navigate("/owner/dashboard");
    } catch (err) {
      console.error("Failed to switch role:", err);
      navigate("/owner/dashboard");
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  // Filtered sidebar restaurants
  const filteredSidebarRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  // Available unique cuisines from registered database
  const availableCuisines = Array.from(new Set(restaurants.map(r => r.cuisine))).filter(Boolean);

  // Filtered directory modal restaurants
  const filteredDirectoryRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
                          r.cuisine.toLowerCase().includes(directorySearch.toLowerCase());
    const matchesCuisine = selectedCuisineFilter === "all" || r.cuisine.toLowerCase() === selectedCuisineFilter.toLowerCase();
    return matchesSearch && matchesCuisine;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-body">Loading TastePulse restaurants...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Demo Notice & Interview Quick Switcher Bar */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 text-xs sm:text-sm font-medium shadow-sm">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-200 animate-pulse" />
            <span>
              <strong>Diner Portal</strong> &mdash; Reviewing registered restaurants on TastePulse
            </span>
          </div>
          <button
            onClick={handleSwitchToOwner}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm transition-all border border-white/30"
          >
            <span>Switch to Owner Dashboard to see your live reviews</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-border bg-card/70 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-amber flex items-center justify-center text-primary-foreground shadow-md">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg sm:text-xl font-bold text-foreground">
                  Taste<span className="text-gradient">Pulse</span> Diner Portal
                </h1>
                <span className="text-xs bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium px-2 py-0.5 rounded-full border border-amber-500/30">
                  Customer View
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-body hidden sm:block">
                Logged in as: <span className="font-medium text-foreground">{user?.displayName || user?.email || "Demo Diner"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBrowseDirectoryOpen(true)}
              className="border-amber-500/40 hover:bg-amber-500/10 text-foreground font-body text-xs sm:text-sm flex items-center gap-1.5"
            >
              <Store className="w-4 h-4 text-amber-500" />
              <span>Browse All Restaurants ({restaurants.length})</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground font-body text-xs sm:text-sm"
            >
              <LogOut className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Sidebar: Verified TastePulse Restaurants */}
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-foreground flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-amber-500" /> Available Restaurants
                  </h2>
                  <p className="text-xs text-muted-foreground font-body">Verified in TastePulse Database</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsBrowseDirectoryOpen(true)}
                  className="text-xs h-8 border-amber-500/40 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                >
                  View All
                </Button>
              </div>

              {/* Sidebar quick search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search restaurants or cuisine..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="h-9 pl-9 text-xs bg-background/80 font-body"
                />
              </div>
            </div>

            {/* Restaurant Cards List */}
            <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {filteredSidebarRestaurants.length === 0 ? (
                <div className="text-center p-6 glass-card rounded-xl">
                  <p className="text-xs text-muted-foreground font-body mb-2">No matching restaurants found.</p>
                  <Button size="sm" variant="ghost" onClick={() => setSidebarSearch("")} className="text-xs text-primary">
                    Clear Search
                  </Button>
                </div>
              ) : (
                filteredSidebarRestaurants.map((restaurant) => {
                  const isSelected = selectedRestaurant?.name === restaurant.name;
                  const total = restaurant.sentimentSummary?.total || 0;
                  const posPct = total > 0 ? Math.round((restaurant.sentimentSummary.positive / total) * 100) : 0;

                  return (
                    <button
                      key={restaurant.id || restaurant.name}
                      onClick={() => handleRestaurantSelect(restaurant)}
                      className={`w-full text-left p-4 rounded-xl border transition-all font-body relative overflow-hidden ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/10 shadow-md ring-1 ring-amber-500/30"
                          : "border-border bg-card/60 hover:bg-card hover:border-amber-500/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-1.5">
                            {restaurant.name}
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-500" />}
                          </h3>
                          <span className="text-[11px] text-muted-foreground">{restaurant.cuisine}</span>
                        </div>
                        <span className="text-[11px] bg-secondary text-secondary-foreground font-medium px-2 py-0.5 rounded-full">
                          {restaurant.averageRating.toFixed(1)} ★
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                        <div className="flex items-center gap-1.5">
                          <StarRating rating={Math.round(restaurant.averageRating)} size={12} />
                          <span className="text-[11px]">({total} reviews)</span>
                        </div>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          {posPct}% positive
                        </span>
                      </div>

                      {/* Mini sentiment bar */}
                      <div className="flex h-1.5 rounded-full overflow-hidden mt-2.5 bg-secondary/80">
                        <div className="bg-emerald-500" style={{ width: `${(restaurant.sentimentSummary?.positive / (total || 1)) * 100}%` }} />
                        <div className="bg-amber-500" style={{ width: `${(restaurant.sentimentSummary?.neutral / (total || 1)) * 100}%` }} />
                        <div className="bg-rose-500" style={{ width: `${(restaurant.sentimentSummary?.negative / (total || 1)) * 100}%` }} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Main Content Area: Selected Restaurant Reviews & Review Submission */}
          <div className="lg:col-span-2 space-y-6">
            {selectedRestaurant ? (
              <>
                {/* Active Restaurant Banner */}
                <div className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-amber-500 font-semibold font-body">
                        Selected Restaurant for Feedback
                      </span>
                      <h2 className="font-display text-2xl font-bold text-foreground">
                        {selectedRestaurant.name}
                      </h2>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-body">
                        <span className="bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full font-medium">
                          {selectedRestaurant.cuisine}
                        </span>
                        <div className="flex items-center gap-1">
                          <StarRating rating={Math.round(selectedRestaurant.averageRating)} size={14} />
                          <span className="font-semibold text-foreground text-sm">{selectedRestaurant.averageRating.toFixed(1)}</span>
                        </div>
                        <span>&bull;</span>
                        <span>{reviews.length} customer reviews</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsBrowseDirectoryOpen(true)}
                      className="border-amber-500/40 text-xs font-body"
                    >
                      Change Restaurant
                    </Button>
                  </div>
                </div>

                {/* Write Review Form Card */}
                <div className="glass-card rounded-2xl p-6 border border-border animate-fade-in shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg gradient-amber flex items-center justify-center text-white">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground">
                        Write a Review for {selectedRestaurant.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-body">
                        Your sentiment will be automatically analyzed by AI and synchronized to the Owner Dashboard.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground font-body block mb-1.5">
                          Your Rating
                        </label>
                        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background border border-border w-fit">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="transition-transform hover:scale-125 focus:outline-none p-0.5"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  star <= rating
                                    ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                                    : "text-muted-foreground/30 hover:text-amber-200"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-bold text-foreground ml-2">
                            {rating} of 5
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-foreground font-body block mb-1.5">
                          Feedback Category
                        </label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="bg-background border-border font-body h-10">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {REVIEW_CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground font-body block mb-1.5">
                        Your Dining Review
                      </label>
                      <Textarea
                        placeholder={`Share your experience at ${selectedRestaurant.name}... (e.g. "The pasta was cooked to perfection and staff was very polite!")`}
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="min-h-[110px] bg-background border-border font-body text-sm resize-y"
                        required
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <p className="text-xs text-muted-foreground font-body">
                        Posting as: <strong className="text-foreground">{user?.displayName || "Demo Diner"}</strong>
                      </p>
                      <Button
                        type="submit"
                        disabled={isSubmitting || !reviewText.trim()}
                        className="gradient-amber text-primary-foreground font-body font-semibold hover:opacity-90 shadow-md flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing Sentiment...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Submit Review to Live System
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Reviews List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-foreground">
                      Reviews for {selectedRestaurant.name} ({reviews.length})
                    </h3>
                    <span className="text-xs text-muted-foreground font-body">
                      Real-time Sentiment Stream
                    </span>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="glass-card rounded-xl p-8 text-center">
                      <p className="text-sm text-muted-foreground font-body">
                        No reviews yet for {selectedRestaurant.name}. Be the first to share your experience!
                      </p>
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="glass-card rounded-xl p-5 border border-border/80 hover:border-amber-500/30 transition-all animate-fade-in space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full gradient-amber flex items-center justify-center text-white shadow-sm font-bold text-xs">
                              {review.customerName ? review.customerName.charAt(0).toUpperCase() : "D"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground font-body text-sm">
                                  {review.customerName}
                                </span>
                                <SentimentBadge sentiment={review.sentiment} />
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-body">
                                <StarRating rating={review.rating} size={12} />
                                <span>&bull;</span>
                                <span>{review.date}</span>
                                {review.category && (
                                  <>
                                    <span>&bull;</span>
                                    <span className="bg-secondary text-secondary-foreground px-2 py-0.2 rounded text-[11px]">
                                      {review.category}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="text-[11px] text-muted-foreground font-mono">
                            Score: {(review.sentimentScore * 100).toFixed(0)}%
                          </span>
                        </div>

                        <p className="text-sm text-foreground/90 font-body leading-relaxed pl-12">
                          {review.text}
                        </p>

                        {/* Owner Reply if exists */}
                        {review.ownerReply && (
                          <div className="ml-12 mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-body">
                            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-semibold mb-1">
                              <span>Chef / Owner Reply:</span>
                              {review.ownerReplyDate && <span className="text-[10px] text-muted-foreground">{review.ownerReplyDate}</span>}
                            </div>
                            <p className="text-foreground/80">{review.ownerReply}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Store className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="font-display text-lg font-bold text-foreground mb-1">No Restaurant Selected</h3>
                <p className="text-sm text-muted-foreground font-body mb-4">
                  Please choose a registered restaurant from the list or directory to view reviews and provide feedback.
                </p>
                <Button onClick={() => setIsBrowseDirectoryOpen(true)} className="gradient-amber text-white font-body">
                  Browse Restaurant Directory
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* TastePulse Restaurant Directory Modal (Restricted to Available Database Restaurants) */}
      <Dialog open={isBrowseDirectoryOpen} onOpenChange={setIsBrowseDirectoryOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-500" /> Available Restaurants on TastePulse
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-body mt-1">
              Select any registered restaurant from the TastePulse database to view feedback and submit reviews.
            </p>

            {/* Search & Cuisine Filter */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by restaurant name or cuisine..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="pl-9 h-10 text-sm font-body bg-background"
                />
              </div>
              <Select value={selectedCuisineFilter} onValueChange={setSelectedCuisineFilter}>
                <SelectTrigger className="w-full sm:w-[160px] h-10 font-body text-xs">
                  <SelectValue placeholder="All Cuisines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cuisines</SelectItem>
                  {availableCuisines.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogHeader>

          {/* Restaurant Directory List */}
          <div className="p-6 overflow-y-auto space-y-3 flex-1">
            {filteredDirectoryRestaurants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-body">
                <p className="text-sm">No registered restaurants match your filter.</p>
              </div>
            ) : (
              filteredDirectoryRestaurants.map((r) => {
                const total = r.sentimentSummary?.total || 0;
                const isSelected = selectedRestaurant?.name === r.name;

                return (
                  <div
                    key={r.id || r.name}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-border bg-card/50 hover:border-amber-500/40 hover:bg-card"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-foreground text-base">{r.name}</h4>
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">
                          {r.cuisine}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                        <StarRating rating={Math.round(r.averageRating)} size={13} />
                        <span className="font-semibold text-foreground">{r.averageRating.toFixed(1)}</span>
                        <span>&bull;</span>
                        <span>{total} total reviews</span>
                        <span>&bull;</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {total > 0 ? Math.round((r.sentimentSummary.positive / total) * 100) : 0}% positive
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        handleRestaurantSelect(r);
                        setIsBrowseDirectoryOpen(false);
                      }}
                      className={isSelected ? "bg-amber-600 text-white" : "gradient-amber text-white font-body"}
                    >
                      {isSelected ? "Active Selected" : "Select & Review →"}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerDashboard;


