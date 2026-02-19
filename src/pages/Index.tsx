import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChefHat, UtensilsCrossed, BarChart3, MessageSquare } from "lucide-react";
import restaurantHero from "@/assets/restaurant-hero.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={restaurantHero} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-background/80" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl gradient-amber flex items-center justify-center mb-6 animate-fade-in">
          <BarChart3 className="w-8 h-8 text-primary-foreground" />
        </div>

        <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground text-center mb-3 animate-fade-in">
          Taste<span className="text-gradient">Pulse</span>
        </h1>
        <p className="text-lg text-muted-foreground font-body text-center max-w-md mb-12 animate-fade-in">
          AI-powered restaurant review sentiment analysis platform
        </p>

        {/* Login Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          <button
            onClick={() => navigate("/owner/login")}
            className="glass-card rounded-2xl p-8 text-left hover:border-primary/40 transition-all hover:shadow-xl group animate-fade-in"
          >
            <div className="w-12 h-12 rounded-xl gradient-amber flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-1">Restaurant Owner</h2>
            <p className="text-sm text-muted-foreground font-body">Access analytics dashboard, track sentiment trends, and manage feedback.</p>
            <div className="flex items-center gap-1.5 mt-4 text-primary text-sm font-medium font-body">
              <BarChart3 className="w-4 h-4" /> View Dashboard →
            </div>
          </button>

          <button
            onClick={() => navigate("/customer/login")}
            className="glass-card rounded-2xl p-8 text-left hover:border-primary/40 transition-all hover:shadow-xl group animate-fade-in"
          >
            <div className="w-12 h-12 rounded-xl gradient-amber flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-1">Customer</h2>
            <p className="text-sm text-muted-foreground font-body">Browse restaurants, read reviews, and share your dining experiences.</p>
            <div className="flex items-center gap-1.5 mt-4 text-primary text-sm font-medium font-body">
              <MessageSquare className="w-4 h-4" /> Write Reviews →
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
