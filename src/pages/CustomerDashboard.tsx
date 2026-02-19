import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Send, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "@/components/StarRating";
import SentimentBadge from "@/components/SentimentBadge";
import { mockRestaurants, mockReviews } from "@/data/mockData";
import { toast } from "sonner";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [selectedRestaurant, setSelectedRestaurant] = useState(mockRestaurants[0]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);

  const restaurantReviews = mockReviews.filter((r) => r.restaurantName === selectedRestaurant.name);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !reviewText.trim()) {
      toast.error("Please add a rating and review text");
      return;
    }
    toast.success("Review submitted! Thank you for your feedback.");
    setReviewText("");
    setRating(0);
  };

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
            <h2 className="font-display text-lg font-semibold text-foreground">Restaurants</h2>
            {mockRestaurants.map((restaurant) => (
              <button
                key={restaurant.id}
                onClick={() => setSelectedRestaurant(restaurant)}
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
                  <StarRating rating={Math.round(restaurant.averageRating)} size={14} />
                  <span className="text-sm text-muted-foreground">{restaurant.averageRating}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{restaurant.totalReviews} reviews</p>

                {/* Mini sentiment bar */}
                <div className="flex h-1.5 rounded-full overflow-hidden mt-3 bg-secondary">
                  <div className="bg-success" style={{ width: `${(restaurant.sentimentSummary.positive / restaurant.sentimentSummary.total) * 100}%` }} />
                  <div className="bg-warning" style={{ width: `${(restaurant.sentimentSummary.neutral / restaurant.sentimentSummary.total) * 100}%` }} />
                  <div className="bg-destructive" style={{ width: `${(restaurant.sentimentSummary.negative / restaurant.sentimentSummary.total) * 100}%` }} />
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
                <Button type="submit" className="gradient-amber text-primary-foreground font-body font-semibold hover:opacity-90 transition-opacity">
                  <Send className="w-4 h-4 mr-2" /> Submit Review
                </Button>
              </form>
            </div>

            {/* Reviews */}
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Reviews ({restaurantReviews.length})
              </h2>
              {restaurantReviews.length === 0 ? (
                <p className="text-muted-foreground font-body text-sm">No reviews yet for this restaurant.</p>
              ) : (
                restaurantReviews.map((review) => (
                  <div key={review.id} className="glass-card rounded-xl p-5 animate-fade-in">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full gradient-amber flex items-center justify-center text-primary-foreground text-sm font-semibold font-body">
                        {review.customerName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground font-body text-sm">{review.customerName}</span>
                          <SentimentBadge sentiment={review.sentiment} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarRating rating={review.rating} size={12} />
                          <span className="text-xs text-muted-foreground font-body">{review.date}</span>
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
    </div>
  );
};

export default CustomerDashboard;
