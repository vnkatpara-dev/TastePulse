import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UtensilsCrossed, Star, MessageSquare, Heart, Sparkles } from "lucide-react";
import restaurantHero from "@/assets/restaurant-hero.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CustomerLogin = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, loginAsDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDemoCustomerLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginAsDemo("customer");
      toast.success("Signed in as Demo Customer!");
      navigate("/customer/dashboard");
    } catch (err: any) {
      console.error("Demo login error:", err);
      navigate("/customer/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      await signIn(email, password, "customer");
      navigate("/customer/dashboard");
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
      await signUp(email, password, "customer");
      navigate("/customer/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle("customer");
      navigate("/customer/dashboard");
    } catch (err: any) {
      if (err.code === "auth/operation-not-allowed") {
        setError("Google authentication is not yet enabled in Firebase Console. Please verify with the project owner or enable it in the Sign-in method tab.");
      } else {
        setError(err.message || "Failed to sign in with Google");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-row-reverse">
      {/* Right - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={restaurantHero}
          alt="Restaurant ambiance"
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        />
        <div className="absolute inset-0 gradient-dark opacity-60" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-primary-foreground">
          <h1 className="font-display text-5xl font-bold mb-4">
            Share Your <span className="text-gradient">Experience</span>
          </h1>
          <p className="text-lg opacity-80 max-w-md font-body">
            Your reviews help restaurants improve and fellow diners discover great food.
          </p>
          <div className="flex gap-6 mt-8">
            {[
              { icon: Star, label: "Rate & Review" },
              { icon: MessageSquare, label: "Share Feedback" },
              { icon: Heart, label: "Save Favorites" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 opacity-70">
                <Icon className="w-4 h-4" />
                <span className="text-sm font-body">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Left - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg gradient-amber flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Diner Portal</h2>
              <p className="text-sm text-muted-foreground font-body">Review & Discover Restaurants</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-100 border border-red-400 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* 1-Click Demo Access for Interviewers */}
          <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5 font-body">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Live Demo Mode
              </span>
              <span className="text-[11px] text-muted-foreground font-body">Instant Access</span>
            </div>
            <Button
              type="button"
              onClick={handleDemoCustomerLogin}
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-body font-semibold shadow-md flex items-center justify-center gap-2"
            >
              ⚡ 1-Click Demo Customer Sign In
            </Button>
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-body">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@email.com"
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
              {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-body">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full h-12 border border-border bg-card text-foreground hover:bg-muted font-body font-semibold text-base flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                className="fill-[#4285F4]"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                className="fill-[#34A853]"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                className="fill-[#FBBC05]"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                className="fill-[#EA4335]"
              />
            </svg>
            Google
          </Button>

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
            Restaurant owner?{" "}
            <button onClick={() => navigate("/owner/login")} className="text-primary hover:underline font-medium">
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
