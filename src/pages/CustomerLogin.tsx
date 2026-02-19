import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UtensilsCrossed, Star, MessageSquare, Heart } from "lucide-react";
import restaurantHero from "@/assets/restaurant-hero.jpg";

const CustomerLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/customer/dashboard");
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

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-body">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-card border-border font-body"
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
              />
            </div>
            <Button type="submit" className="w-full h-12 gradient-amber text-primary-foreground font-body font-semibold text-base hover:opacity-90 transition-opacity">
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground font-body">
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
