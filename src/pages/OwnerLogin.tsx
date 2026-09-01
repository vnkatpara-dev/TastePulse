import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChefHat, BarChart3, TrendingUp, Shield, Sparkles } from "lucide-react";
import restaurantHero from "@/assets/restaurant-hero.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const OwnerLogin = () => {
  const navigate = useNavigate();
  const { signIn, signUp, loginAsDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDemoOwnerLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginAsDemo("owner");
      toast.success("Signed in as Demo Restaurant Owner!");
      navigate("/owner/dashboard");
    } catch (err: any) {
      console.error("Demo login error:", err);
      navigate("/owner/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      await signIn(email, password, "owner");
      navigate("/owner/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      await signUp(email, password, "owner");
      navigate("/owner/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={restaurantHero}
          alt="Restaurant ambiance"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 gradient-dark opacity-70" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-primary-foreground">
          <h1 className="font-display text-5xl font-bold mb-4">
            Understand Your <span className="text-gradient">Guests</span>
          </h1>
          <p className="text-lg opacity-80 max-w-md font-body">
            AI-powered sentiment analysis to transform customer feedback into actionable insights.
          </p>
          <div className="flex gap-6 mt-8">
            {[
              { icon: BarChart3, label: "Real-time Analytics" },
              { icon: TrendingUp, label: "Trend Insights" },
              { icon: Shield, label: "Secure Data" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 opacity-70">
                <Icon className="w-4 h-4" />
                <span className="text-sm font-body">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg gradient-amber flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Owner Portal</h2>
              <p className="text-sm text-muted-foreground font-body">Sentiment Analytics Dashboard</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-100 border border-red-400 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* 1-Click Demo Access for Interviewers */}
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5 font-body">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Live Demo Mode
              </span>
              <span className="text-[11px] text-muted-foreground font-body">Instant Access</span>
            </div>
            <Button
              type="button"
              onClick={handleDemoOwnerLogin}
              disabled={loading}
              className="w-full h-11 gradient-amber text-primary-foreground font-body font-semibold shadow-md flex items-center justify-center gap-2"
            >
              ⚡ 1-Click Demo Owner Sign In
            </Button>
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-body">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="owner@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-card border-border font-body"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-body">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-card border-border font-body"
                required
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 gradient-amber text-primary-foreground font-body font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In to Dashboard"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground font-body">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button 
              onClick={() => setIsSignUp(!isSignUp)} 
              className="text-primary hover:underline font-medium"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>

          <p className="mt-4 text-center text-sm text-muted-foreground font-body">
            Are you a customer?{" "}
            <button onClick={() => navigate("/customer/login")} className="text-primary hover:underline font-medium">
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerLogin;
