import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChefHat, UtensilsCrossed, BarChart3, MessageSquare, User } from "lucide-react";
import restaurantHero from "@/assets/restaurant-hero.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Restaurant-style background with multiple layers */}
      <div className="absolute inset-0">
        {/* Main background image */}
        <img src={restaurantHero} alt="" className="w-full h-full object-cover" />
        
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Logo */}
        <div className="relative mb-8 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-2xl relative overflow-hidden group">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            <div className="absolute inset-0 rounded-3xl border-2 border-amber-300/30 group-hover:border-amber-200/50 transition-colors" />
            
            {/* Fork icon with pulse effect */}
            <div className="relative z-10">
              <UtensilsCrossed className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            
            {/* Decorative pulse rings */}
            <div className="absolute inset-0 rounded-3xl border border-amber-300/20 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        <h1 className="font-display text-5xl md:text-6xl font-bold text-white text-center mb-3 animate-fade-in drop-shadow-lg">
          Taste<span className="text-gradient">Pulse</span>
        </h1>
        <p className="text-lg text-white/80 font-body text-center max-w-md mb-12 animate-fade-in">
          Discover What People Really Think
        </p>

        {/* Login Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          <button
            onClick={() => navigate("/owner/login")}
            className="group relative rounded-2xl p-8 text-left transition-all hover:shadow-2xl overflow-hidden animate-fade-in"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/40 via-orange-600/30 to-transparent rounded-2xl" />
            <div className="absolute inset-0 border border-amber-500/50 rounded-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40 rounded-2xl" />
            <div className="absolute inset-0 backdrop-blur-md rounded-2xl" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl gradient-amber flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <ChefHat className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">Restaurant Owner</h2>
              <p className="text-sm text-white/90 font-body leading-relaxed">Access analytics dashboard, track sentiment trends, and manage feedback.</p>
              <div className="flex items-center gap-1.5 mt-6 text-amber-300 text-sm font-semibold font-body group-hover:gap-2 transition-all">
                <BarChart3 className="w-4 h-4" /> View Dashboard →
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/customer/login")}
            className="group relative rounded-2xl p-8 text-left transition-all hover:shadow-2xl overflow-hidden animate-fade-in"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/40 via-amber-500/30 to-transparent rounded-2xl" />
            <div className="absolute inset-0 border border-orange-400/50 rounded-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40 rounded-2xl" />
            <div className="absolute inset-0 backdrop-blur-md rounded-2xl" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl gradient-amber flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">Customer</h2>
              <p className="text-sm text-white/90 font-body leading-relaxed">Browse restaurants, read reviews, and share your dining experiences.</p>
              <div className="flex items-center gap-1.5 mt-6 text-amber-300 text-sm font-semibold font-body group-hover:gap-2 transition-all">
                <MessageSquare className="w-4 h-4" /> Write Reviews →
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
