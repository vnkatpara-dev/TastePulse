import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Send, Star, Loader2, Plus, Trash2, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import StarRating from "@/components/StarRating";
import SentimentBadge from "@/components/SentimentBadge";
import { Restaurant, Review, getRestaurants, getReviewsByRestaurant, addReview, addRestaurant, deleteRestaurant, deleteReview } from "@/services/api";
import { toast } from "sonner";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddRestaurantOpen, setIsAddRestaurantOpen] = useState(false);
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [newRestaurantCuisine, setNewRestaurantCuisine] = useState("");
  const [isAddingRestaurant, setIsAddingRestaurant] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const restaurantsData = await getRestaurants();
        setRestaurants(restaurantsData);
        if (restaurantsData.length > 0) {
          setSelectedRestaurant(restaurantsData[0]);
          // Filter reviews for the selected restaurant
          const reviewsData = await getReviewsByRestaurant(restaurantsData[0].name);
          setReviews(reviewsData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load data. Please make sure the backend is running.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    // Filter reviews for selected restaurant
    getReviewsByRestaurant(restaurant.name)
      .then(setReviews)
      .catch(console.error);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !reviewText.trim()) {
      toast.error("Please add a rating and review text");
      return;
    }
    if (!selectedRestaurant) {
      toast.error("Please select a restaurant");
      return;
    }

    try {
      setIsSubmitting(true);
      const newReview = await addReview({
        customerName: "Guest User",
        restaurantName: selectedRestaurant.name,
        rating,
        text: reviewText,
        category: "General"
      });
      
      toast.success("Review submitted! Sentiment: " + newReview.sentiment);
      setReviews([newReview, ...reviews]);
      setReviewText("");
      setRating(0);
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review. Please make sure the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRestaurant = async () => {
    if (!newRestaurantName.trim() || !newRestaurantCuisine.trim()) {
      toast.error("Please enter restaurant name and cuisine");
      return;
    }

    try {
      setIsAddingRestaurant(true);
      const newRestaurant = await addRestaurant({
        name: newRestaurantName,
        cuisine: newRestaurantCuisine
      });
      
      toast.success("Restaurant added successfully!");
      setRestaurants([...restaurants, newRestaurant]);
      setNewRestaurantName("");
      setNewRestaurantCuisine("");
      setIsAddRestaurantOpen(false);
    } catch (error) {
      console.error("Failed to add restaurant:", error);
      toast.error("Failed to add restaurant.");
    } finally {
      setIsAddingRestaurant(false);
    }
  };

  const handleDeleteRestaurant = async (restaurantId: string, restaurantName: string) => {
    if (!confirm(`Are you sure you want to delete "${restaurantName}"?`)) {
      return;
    }

    try {
      await deleteRestaurant(restaurantId);
      toast.success("Restaurant deleted successfully!");
      const updatedRestaurants = restaurants.filter(r => r.id !== restaurantId);
      setRestaurants(updatedRestaurants);
      
      // If the deleted restaurant was selected, select another one
      if (selectedRestaurant?.id === restaurantId) {
        setSelectedRestaurant(updatedRestaurants.length > 0 ? updatedRestaurants[0] : null);
        if (updatedRestaurants.length > 0) {
          const reviewsData = await getReviewsByRestaurant(updatedRestaurants[0].name);
          setReviews(reviewsData);
        } else {
          setReviews([]);
        }
      }
    } catch (error) {
      console.error("Failed to delete restaurant:", error);
      toast.error("Failed to delete restaurant.");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await deleteReview(reviewId);
        toast.success("Review deleted successfully");
        // Refresh reviews
        if (selectedRestaurant) {
          const reviewsData = await getReviewsByRestaurant(selectedRestaurant.name);
          setReviews(reviewsData);
        }
      } catch (error) {
        console.error("Failed to delete review:", error);
        toast.error("Failed to delete review");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedRestaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No restaurants available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Restaurant Reviews</h1>
            <p className="text-sm text-muted-foreground font-body">Discover & share dining experiences</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground font-body">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Restaurant List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Restaurants</h2>
              <Button size="sm" onClick={() => setIsAddRestaurantOpen(true)} className="gradient-amber text-primary-foreground font-body">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            {restaurants.map((restaurant) => (
              <button
                key={restaurant.id}
                onClick={() => handleRestaurantSelect(restaurant)}
                className={`w-full text-left p-5 rounded-xl border transition-all font-body ${
                  selectedRestaurant.id === restaurant.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-semibold text-foreground">{restaurant.name}</h3>
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{restaurant.cuisine}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(restaurant.sentimentSummary.averageRating)} size={14} />
                  <span className="text-sm text-muted-foreground">{restaurant.sentimentSummary.averageRating}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{restaurant.sentimentSummary.total} reviews</p>

                {/* Mini sentiment bar */}
                <div className="flex h-1.5 rounded-full overflow-hidden mt-3 bg-secondary">
                  <div className="bg-success" style={{ width: `${(restaurant.sentimentSummary.positive / (restaurant.sentimentSummary.total || 1)) * 100}%` }} />
                  <div className="bg-warning" style={{ width: `${(restaurant.sentimentSummary.neutral / (restaurant.sentimentSummary.total || 1)) * 100}%` }} />
                  <div className="bg-destructive" style={{ width: `${(restaurant.sentimentSummary.negative / (restaurant.sentimentSummary.total || 1)) * 100}%` }} />
                </div>
                <div className="mt-2 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteRestaurant(restaurant.id, restaurant.name); }} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Write Review */}
            <div className="glass-card rounded-xl p-6 animate-fade-in">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                Write a Review for {selectedRestaurant.name}
              </h2>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground font-body mb-2">Your Rating</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-7 h-7 ${star <= rating ? "fill-primary text-primary" : "text-border"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  placeholder="Share your dining experience..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="min-h-[100px] bg-background border-border font-body"
                />
                <Button type="submit" disabled={isSubmitting} className="gradient-amber text-primary-foreground font-body font-semibold hover:opacity-90 transition-opacity">
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit Review
                </Button>
              </form>
            </div>

            {/* Reviews */}
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Reviews ({reviews.length})
              </h2>
              {reviews.length === 0 ? (
                <p className="text-muted-foreground font-body text-sm">No reviews yet for this restaurant.</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="glass-card rounded-xl p-5 animate-fade-in">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full gradient-amber flex items-center justify-center text-primary-foreground">
                        <UserCircle2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground font-body text-sm">{review.customerName}</span>
                          <SentimentBadge sentiment={review.sentiment} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarRating rating={review.rating} size={12} />
                          <span className="text-xs text-muted-foreground font-body">{review.date}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteReview(review.id)} 
                            className="text-muted-foreground hover:text-red-500 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground font-body leading-relaxed">{review.text}</p>
                    <div className="mt-2">
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-body">
                        {review.category}
                      </span>
                    </div>
                  </div>
                ))
            )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Restaurant Dialog */}
      <Dialog open={isAddRestaurantOpen} onOpenChange={setIsAddRestaurantOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Restaurant</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Input
                id="name"
                placeholder="Restaurant Name"
                value={newRestaurantName}
                onChange={(e) => setNewRestaurantName(e.target.value)}
                className="col-span-4"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Input
                id="cuisine"
                placeholder="Cuisine Type"
                value={newRestaurantCuisine}
                onChange={(e) => setNewRestaurantCuisine(e.target.value)}
                className="col-span-4"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddRestaurant} disabled={isAddingRestaurant}>
              {isAddingRestaurant ? "Adding..." : "Add Restaurant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerDashboard;

