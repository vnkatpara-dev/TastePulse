import { useNavigate } from "react-router-dom";
import { ChefHat, UtensilsCrossed, BarChart3, MessageSquare } from "lucide-react";
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
        <div className="absolute inset-0 bg-black/55" />
        
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
        
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-amber-500/15 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8 sm:py-12">
        {/* Logo */}
        <div className="relative mb-6 animate-fade-in">
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

        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white text-center mb-2 animate-fade-in drop-shadow-lg">
          Taste<span className="text-gradient">Pulse</span>
        </h1>
        <p className="text-base sm:text-lg text-white/90 font-body text-center max-w-sm sm:max-w-md mb-8 animate-fade-in px-4">
          Discover What People Really Think
        </p>

        {/* Regular Login Portal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl px-2 sm:px-0">
          <div
            onClick={() => navigate("/owner/login")}
            className="cursor-pointer group relative rounded-2xl p-6 sm:p-7 text-left transition-all hover:shadow-2xl overflow-hidden animate-fade-in border border-amber-500/40 bg-black/40 backdrop-blur-md hover:border-amber-400"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/30 via-orange-600/20 to-transparent rounded-2xl" />
            <div className="relative z-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-amber flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Restaurant Owner</h2>
              <p className="text-xs sm:text-sm text-white/85 font-body leading-relaxed mb-4">
                Access analytics dashboard, track sentiment trends, and manage feedback.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-amber-300 text-sm font-semibold font-body flex items-center gap-1 group-hover:gap-2 transition-all">
                  <BarChart3 className="w-4 h-4" /> Owner Sign In →
                </span>
                <span className="text-xs text-amber-200/80 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                  Analytics
                </span>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate("/customer/login")}
            className="cursor-pointer group relative rounded-2xl p-6 sm:p-7 text-left transition-all hover:shadow-2xl overflow-hidden animate-fade-in border border-orange-400/40 bg-black/40 backdrop-blur-md hover:border-orange-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 via-amber-500/20 to-transparent rounded-2xl" />
            <div className="relative z-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-amber flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Customer</h2>
              <p className="text-xs sm:text-sm text-white/85 font-body leading-relaxed mb-4">
                Browse restaurants, read reviews, and share your dining experiences.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-amber-300 text-sm font-semibold font-body flex items-center gap-1 group-hover:gap-2 transition-all">
                  <MessageSquare className="w-4 h-4" /> Diner Sign In →
                </span>
                <span className="text-xs text-orange-200/80 bg-orange-500/20 px-2 py-0.5 rounded-full border border-orange-400/30">
                  Reviews
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

