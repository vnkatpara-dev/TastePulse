import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { MessageSquare, TrendingUp, ThumbsUp, ThumbsDown, LogOut, Star, Loader2, Plus, Pencil, Trash2, X, Download, Lightbulb, ChefHat, AlertTriangle, CheckCircle, Users, BarChart2, Trophy, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatCard from "@/components/StatCard";
import SentimentBadge from "@/components/SentimentBadge";
import StarRating from "@/components/StarRating";
import ChurnWarningPanel from "@/components/ChurnWarningPanel";
import MenuLifecycleChart from "@/components/MenuLifecycleChart";
import CompetitorBenchmark from "@/components/CompetitorBenchmark";
import { getAnalytics, getReviews, getSentimentTrend, getCategoryBreakdown, getRestaurants, addRestaurant, deleteRestaurant, updateRestaurant, deleteReview, getDishInsights, getChurnRisks, getMenuLifecycle, getCompetitorBenchmark, Review, Analytics, SentimentTrend, CategoryBreakdown, Restaurant, DishInsight, ChurnRisk, MenuLifecycleItem, CompetitorBenchmarkItem } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const COLORS = {
  positive: "hsl(142, 72%, 40%)",
  negative: "hsl(0, 72%, 51%)",
  neutral: "hsl(36, 80%, 50%)",
};

// Category suggestions based on analysis
const getCategorySuggestions = (categoryData: CategoryBreakdown[]): { category: string; suggestion: string; severity: 'high' | 'medium' | 'low' }[] => {
  const suggestions: { category: string; suggestion: string; severity: 'high' | 'medium' | 'low' }[] = [];
  
  categoryData.forEach(cat => {
    const total = cat.positive + cat.negative;
    if (total > 0) {
      const negativeRatio = cat.negative / total;
      
      if (negativeRatio >= 0.5) {
        suggestions.push({
          category: cat.name,
          suggestion: `Critical: Over 50% negative reviews in ${cat.name}. Immediate attention required. Focus on improving quality and addressing customer concerns in this area.`,
          severity: 'high'
        });
      } else if (negativeRatio >= 0.3) {
        suggestions.push({
          category: cat.name,
          suggestion: `Warning: ${Math.round(negativeRatio * 100)}% negative reviews in ${cat.name}. Consider implementing improvements and monitoring closely.`,
          severity: 'medium'
        });
      } else if (negativeRatio >= 0.15) {
        suggestions.push({
          category: cat.name,
          suggestion: `Notice: Some negative feedback in ${cat.name}. Review specific complaints and make incremental improvements.`,
          severity: 'low'
        });
      }
    }
  });
  
  return suggestions.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
};

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { user, loginAsDemo, logout } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);
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
  
  // Report timeframe dialog state
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportTimeframe, setReportTimeframe] = useState<"today" | "lastNDays" | "custom">("today");
  const [lastNDays, setLastNDays] = useState(7);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  
  // Selected restaurant state
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // Dish insights state
  const [dishInsights, setDishInsights] = useState<DishInsight[]>([]);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);

  // Unique feature states
  const [churnRisks, setChurnRisks] = useState<ChurnRisk[]>([]);
  const [isChurnLoading, setIsChurnLoading] = useState(false);
  const [menuLifecycle, setMenuLifecycle] = useState<MenuLifecycleItem[]>([]);
  const [isLifecycleLoading, setIsLifecycleLoading] = useState(false);
  const [competitorBenchmark, setCompetitorBenchmark] = useState<CompetitorBenchmarkItem[]>([]);
  const [isBenchmarkLoading, setIsBenchmarkLoading] = useState(false);

  const fetchInsights = async () => {
    try {
      setIsInsightsLoading(true);
      const data = await getDishInsights(selectedRestaurant?.name || undefined);
      setDishInsights(data);
    } catch (error) {
      console.error("Failed to fetch dish insights:", error);
    } finally {
      setIsInsightsLoading(false);
    }
  };

  const fetchChurn = async () => {
    try {
      setIsChurnLoading(true);
      const data = await getChurnRisks(selectedRestaurant?.name || undefined);
      setChurnRisks(data);
    } catch (error) {
      console.error("Failed to fetch churn risks:", error);
    } finally {
      setIsChurnLoading(false);
    }
  };

  const fetchLifecycle = async () => {
    try {
      setIsLifecycleLoading(true);
      const data = await getMenuLifecycle(selectedRestaurant?.name || undefined);
      setMenuLifecycle(data);
    } catch (error) {
      console.error("Failed to fetch menu lifecycle:", error);
    } finally {
      setIsLifecycleLoading(false);
    }
  };

  const fetchBenchmark = async () => {
    try {
      setIsBenchmarkLoading(true);
      const data = await getCompetitorBenchmark();
      setCompetitorBenchmark(data);
    } catch (error) {
      console.error("Failed to fetch benchmark:", error);
    } finally {
      setIsBenchmarkLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [selectedRestaurant]);

  useEffect(() => {
    fetchChurn();
  }, [selectedRestaurant]);

  useEffect(() => {
    fetchLifecycle();
  }, [selectedRestaurant]);

  useEffect(() => {
    fetchBenchmark();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [analyticsData, reviewsData, trendData, categoryData, restaurantsData] = await Promise.all([
        getAnalytics().catch(() => null),
        getReviews(),
        getSentimentTrend().catch(() => []),
        getCategoryBreakdown().catch(() => []),
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

  useEffect(() => {
    fetchData();
    
    // Live update listener for instant cross-tab & cross-session customer review updates
    const handleStoreUpdate = () => {
      fetchData();
      fetchInsights();
      fetchChurn();
      fetchLifecycle();
      fetchBenchmark();
    };

    window.addEventListener('tastepulse_review_store_updated', handleStoreUpdate);

    // Auto-refresh reviews periodically
    const interval = setInterval(() => {
      getReviews().then(setReviews).catch(console.error);
    }, 10000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('tastepulse_review_store_updated', handleStoreUpdate);
    };
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
    { name: "Positive Reviews", value: filteredAnalytics?.positive || 0, color: COLORS.positive },
    { name: "Negative Reviews", value: filteredAnalytics?.negative || 0, color: COLORS.negative },
    { name: "Neutral", value: filteredAnalytics?.neutral || 0, color: COLORS.neutral },
  ];

  // Filter category breakdown for selected restaurant
  const filteredCategoryBreakdown = selectedRestaurant 
    ? categoryBreakdown.filter(cat => 
        filteredReviews.some(r => r.category === cat.name)
      ).map(cat => ({
        ...cat,
        positive: filteredReviews.filter(r => r.category === cat.name && r.sentiment === 'positive').length,
        negative: filteredReviews.filter(r => r.category === cat.name && r.sentiment === 'negative').length
      }))
    : categoryBreakdown;

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
          getAnalytics().catch(() => null),
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
        toast.error("Failed to delete restaurant");
      }
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await deleteReview(reviewId);
        toast.success("Review deleted successfully");
        // Refresh reviews
        const reviewsData = await getReviews();
        setReviews(reviewsData);
      } catch (error) {
        console.error("Failed to delete review:", error);
        toast.error("Failed to delete review");
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
      toast.error("Please fill in all fields");
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
        toast.success("Restaurant updated successfully!");
      } else {
        // Add new restaurant
        await addRestaurant({
          name: restaurantName,
          cuisine: restaurantCuisine
        });
        toast.success("Restaurant added successfully!");
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
      toast.error("Failed to save restaurant. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate PDF Report
  const handleDownloadReport = async () => {
    if (!reportRef.current) return;

    try {
      toast.info("Generating PDF report...");
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(40, 40, 40);
      pdf.text("TastePulse - Restaurant Report", pdfWidth / 2, 15, { align: "center" });
      
      if (selectedRestaurant) {
        pdf.setFontSize(14);
        pdf.text(selectedRestaurant.name, pdfWidth / 2, 25, { align: "center" });
        pdf.setFontSize(10);
        pdf.text(`Cuisine: ${selectedRestaurant.cuisine}`, pdfWidth / 2, 32, { align: "center" });
      }

      // Add the captured content
      pdf.addImage(imgData, "PNG", imgX, 40, pdfWidth - 20, (imgHeight * ratio) - 30);
      
      // Add suggestions page if there are any
      const suggestions = getCategorySuggestions(filteredCategoryBreakdown);
      if (suggestions.length > 0) {
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.setTextColor(40, 40, 40);
        pdf.text("Improvement Suggestions", 15, 20);
        
        let yPos = 35;
        suggestions.forEach((suggestion, index) => {
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
          }
          
          // Color based on severity
          if (suggestion.severity === 'high') {
            pdf.setTextColor(200, 0, 0);
          } else if (suggestion.severity === 'medium') {
            pdf.setTextColor(200, 100, 0);
          } else {
            pdf.setTextColor(100, 100, 0);
          }
          
          pdf.setFontSize(11);
          pdf.text(`${index + 1}. ${suggestion.category}:`, 15, yPos);
          yPos += 6;
          
          pdf.setFontSize(10);
          pdf.setTextColor(60, 60, 60);
          const lines = pdf.splitTextToSize(suggestion.suggestion, 170);
          pdf.text(lines, 20, yPos);
          yPos += lines.length * 5 + 5;
        });
      }

      // Add dish insights recommendations to the PDF
      const activePlans: { name: string; text: string; severity: string }[] = [];
      dishInsights.forEach((insight) => {
        const negRatio = insight.sentiment.negative / insight.count;
        if (negRatio >= 0.25 || insight.sentiment.negative > insight.sentiment.positive) {
          let actionText = "";
          let severity = "medium";
          
          if (insight.name === "Pasta & Lasagna") {
            actionText = "Lasagna and pasta texture complaints. Task kitchen staff to verify noodle firmness and boiling timings.";
            severity = "medium";
          } else if (insight.name === "Service Quality") {
            actionText = "Hostess reservation errors & slow serving speed. Review weekend staffing levels & booking desk processes.";
            severity = "high";
          } else if (insight.name === "Value & Pricing") {
            actionText = "Concerns over high pricing and portion sizes. Consider creating multi-course combos or slightly increasing plate sizes.";
            severity = "medium";
          } else if (insight.name === "Hygiene Standards") {
            actionText = "Urgent hygiene complaints. Conduct an immediate walk-through of the main washing line and enforce hairnet policies.";
            severity = "high";
          } else if (insight.name === "Seafood & Lobster") {
            actionText = "Seafood saltiness/freshness complaints. Audit storage temperatures and supplier batch logs.";
            severity = "high";
          } else {
            actionText = `Quality issues detected. Perform kitchen or service review focusing on guest complaints for ${insight.name}.`;
            severity = "medium";
          }
          
          activePlans.push({ name: insight.name, text: actionText, severity });
        }
      });

      if (activePlans.length > 0) {
        // If there wasn't a suggestions page created yet, create one
        if (suggestions.length === 0) {
          pdf.addPage();
          pdf.setFontSize(16);
          pdf.setTextColor(40, 40, 40);
          pdf.text("Operational Action Plans & Suggestions", 15, 20);
        } else {
          // If a page existed, start a fresh page for menu action plans
          pdf.addPage();
          pdf.setFontSize(16);
          pdf.setTextColor(40, 40, 40);
          pdf.text("Operational Action Plans (Menu & Aspects)", 15, 20);
        }
        
        let yPos = 35;
        activePlans.forEach((plan, index) => {
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
          }
          
          // Color based on severity
          if (plan.severity === 'high') {
            pdf.setTextColor(200, 0, 0);
          } else {
            pdf.setTextColor(200, 100, 0);
          }
          
          pdf.setFontSize(11);
          pdf.text(`${index + 1}. ${plan.name} (${plan.severity.toUpperCase()}):`, 15, yPos);
          yPos += 6;
          
          pdf.setFontSize(10);
          pdf.setTextColor(60, 60, 60);
          const lines = pdf.splitTextToSize(plan.text, 170);
          pdf.text(lines, 20, yPos);
          yPos += lines.length * 5 + 5;
        });
      }

      // Add footer
      const date = new Date().toLocaleDateString();
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${date} by TastePulse`, pdfWidth / 2, pdfHeight - 10, { align: "center" });

      const fileName = selectedRestaurant 
        ? `TastePulse_Report_${selectedRestaurant.name.replace(/\s+/g, '_')}_${date}.pdf`
        : `TastePulse_Report_All_Restaurants_${date}.pdf`;
      
      pdf.save(fileName);
      toast.success("Report downloaded successfully!");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSwitchToCustomer = async () => {
    try {
      await loginAsDemo("customer");
      toast.success("Switched to Customer Diner Portal");
      navigate("/customer/dashboard");
    } catch (err) {
      console.error("Failed to switch role:", err);
      navigate("/customer/dashboard");
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Demo Notice & Interview Quick Switcher Bar */}
      <div className="bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-800 text-white px-4 py-2 text-xs sm:text-sm font-medium shadow-sm">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-200 animate-pulse" />
            <span>
              <strong>Owner Analytics Portal</strong> &mdash; Real-time AI Sentiment &amp; Guest Feedback Intelligence
            </span>
          </div>
          <button
            onClick={handleSwitchToCustomer}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm transition-all border border-white/30"
          >
            <span>Switch to Customer View to submit a review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-border bg-card/70 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg sm:text-2xl font-bold text-foreground truncate">
                {selectedRestaurant ? selectedRestaurant.name : "TastePulse Sentiment Intelligence"}
              </h1>
              <span className="text-xs bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium px-2 py-0.5 rounded-full border border-amber-500/30">
                Owner Portal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-body hidden sm:block">
              {selectedRestaurant ? `${selectedRestaurant.cuisine} · Restaurant Analytics` : `Logged in as: ${user?.displayName || "Chef Marco (Demo Owner)"}`}
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {selectedRestaurant && (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsReportDialogOpen(true)} className="font-body hidden sm:flex">
                  <Download className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Report</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedRestaurant(null)} className="font-body">
                  <X className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">View All</span>
                </Button>
              </>
            )}
            <Button variant="default" size="sm" onClick={handleAddRestaurant} className="font-body gradient-amber text-primary-foreground font-semibold">
              <Plus className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Add Restaurant</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground font-body">
              <LogOut className="w-4 h-4 sm:mr-1.5" /><span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Report Content - This is what gets captured for PDF */}
      <div ref={reportRef} className="bg-background">
        <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-8">
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard 
              title="Total Reviews of All Customers" 
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
              title="Positive Reviews" 
              value={`${filteredAnalytics?.positivePercent || 0}%`} 
              icon={<ThumbsUp className="w-5 h-5" />} 
              subtitle={`${filteredAnalytics?.positive || 0} reviews`} 
            />
            <StatCard 
              title="Negative Reviews" 
              value={`${filteredAnalytics?.negativePercent || 0}%`} 
              icon={<ThumbsDown className="w-5 h-5" />} 
              subtitle={`${filteredAnalytics?.negative || 0} reviews`} 
            />
          </div>

          {/* Restaurants Management */}
          <div className="glass-card rounded-xl p-4 sm:p-6 animate-fade-in">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              {selectedRestaurant ? "Restaurant Details" : "My Restaurants"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Sentiment Trend */}
            <div className="lg:col-span-2 glass-card rounded-xl p-4 sm:p-6 animate-fade-in">
              <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-4">
                {selectedRestaurant ? `${selectedRestaurant.name} - Sentiment Trend` : "Sentiment Trend"}
              </h3>
              {sentimentTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={sentimentTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
                    <XAxis dataKey="month" stroke="hsl(30, 5%, 45%)" fontSize={12} />
                    <YAxis stroke="hsl(30, 5%, 45%)" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(30, 15%, 95%)", border: "1px solid hsl(30, 15%, 88%)", borderRadius: "8px", fontFamily: "Inter" }} />
                    <Legend />
                    <Line type="monotone" dataKey="positive" stroke={COLORS.positive} strokeWidth={2} dot={{ r: 4 }} name="Positive Reviews" />
                    <Line type="monotone" dataKey="negative" stroke={COLORS.negative} strokeWidth={2} dot={{ r: 4 }} name="Negative Reviews" />
                    <Line type="monotone" dataKey="neutral" stroke={COLORS.neutral} strokeWidth={2} dot={{ r: 4 }} name="Neutral" />
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
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={filteredPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                    {filteredPieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", fontFamily: "Inter" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>



          {/* Menu & Aspect Intelligence */}
          <div className="glass-card rounded-xl p-6 animate-fade-in space-y-6">
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-primary" />
                Menu & Aspect Intelligence
              </h3>
              <p className="text-sm text-muted-foreground font-body">
                Detailed sentiment breakdown and automated operational recommendations for specific menu items and operational aspects
              </p>
            </div>

            {isInsightsLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : dishInsights.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visual list with progress bars */}
                <div className="lg:col-span-2 space-y-4">
                  {dishInsights.map((insight) => {
                    const total = insight.count;
                    const posPercent = Math.round((insight.sentiment.positive / total) * 100);
                    const negPercent = Math.round((insight.sentiment.negative / total) * 100);
                    const neuPercent = 100 - posPercent - negPercent;
                    
                    return (
                      <div key={insight.name} className="p-4 rounded-lg bg-background/40 border border-border/40 space-y-2">
                        <div className="flex items-center justify-between font-body text-sm">
                          <span className="font-semibold text-foreground">{insight.name}</span>
                          <span className="text-xs text-muted-foreground">{total} mentions</span>
                        </div>
                        {/* Stacked Progress Bar */}
                        <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted">
                          {posPercent > 0 && (
                            <div 
                              style={{ width: `${posPercent}%` }} 
                              className="bg-emerald-500 h-full transition-all" 
                              title={`Positive: ${posPercent}%`}
                            />
                          )}
                          {neuPercent > 0 && (
                            <div 
                              style={{ width: `${neuPercent}%` }} 
                              className="bg-amber-500 h-full transition-all" 
                              title={`Neutral: ${neuPercent}%`}
                            />
                          )}
                          {negPercent > 0 && (
                            <div 
                              style={{ width: `${negPercent}%` }} 
                              className="bg-red-500 h-full transition-all" 
                              title={`Negative: ${negPercent}%`}
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xxs font-body text-muted-foreground pt-1 flex-wrap gap-2">
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Positive: {posPercent}%</span>
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Neutral: {neuPercent}%</span>
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Negative: {negPercent}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recommendations Plan */}
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-card border border-border/50 h-full shadow-sm flex flex-col">
                    <h4 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3 shrink-0">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      Operational Action Plan
                    </h4>
                    <div className="space-y-3 font-body text-xs text-muted-foreground flex-1 overflow-y-auto max-h-[380px] pr-1">
                      {/* Scan insights for critical values */}
                      {(() => {
                        const plans: React.ReactNode[] = [];
                        dishInsights.forEach((insight) => {
                          const negRatio = insight.sentiment.negative / insight.count;
                          
                          if (negRatio >= 0.25 || insight.sentiment.negative > insight.sentiment.positive) {
                            let actionText = "";
                            let severity: "high" | "medium" = "medium";
                            
                            if (insight.name === "Pasta & Lasagna") {
                              actionText = "Lasagna and pasta texture complaints. Task kitchen staff to verify noodle firmness and boiling timings.";
                              severity = "medium";
                            } else if (insight.name === "Service Quality") {
                              actionText = "Hostess reservation errors & slow serving speed. Review weekend staffing levels & booking desk processes.";
                              severity = "high";
                            } else if (insight.name === "Value & Pricing") {
                              actionText = "Concerns over high pricing and portion sizes. Consider creating multi-course combos or slightly increasing plate sizes.";
                              severity = "medium";
                            } else if (insight.name === "Hygiene Standards") {
                              actionText = "Urgent hygiene complaints. Conduct an immediate walk-through of the main washing line and enforce hairnet policies.";
                              severity = "high";
                            } else if (insight.name === "Seafood & Lobster") {
                              actionText = "Seafood saltiness/freshness complaints. Audit storage temperatures and supplier batch logs.";
                              severity = "high";
                            } else {
                              actionText = `Quality issues detected. Perform kitchen or service review focusing on guest complaints for ${insight.name}.`;
                              severity = "medium";
                            }
                            
                            plans.push(
                              <div key={insight.name} className={`p-3 rounded border flex flex-col gap-1 transition-all hover:shadow-sm ${
                                severity === 'high' ? 'bg-red-50/80 border-red-200 text-red-900' : 'bg-orange-50/80 border-orange-200 text-orange-950'
                              }`}>
                                <div className="flex items-center justify-between font-semibold text-xs">
                                  <span>{insight.name}</span>
                                  <span className={`text-xxs px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                                    severity === 'high' ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'
                                  }`}>{severity === 'high' ? 'Critical' : 'Attention'}</span>
                                </div>
                                <p className="text-xxs opacity-90 leading-relaxed">{actionText}</p>
                              </div>
                            );
                          }
                        });
                        
                        return plans.length > 0 ? plans : (
                          <div className="text-center py-12 text-emerald-600 font-semibold flex flex-col items-center justify-center gap-2 h-full">
                            <CheckCircle className="w-10 h-10 text-emerald-500" />
                            <span className="text-sm">All Monitored Aspects Healthy</span>
                            <span className="text-xxs font-normal opacity-85">Mentions and customer feedback are in healthy margins!</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground font-body text-sm border border-dashed border-border rounded-lg">
                No menu or aspect mentions found in the reviews yet
              </div>
            )}
          </div>

          {/* ── Predictive Churn Warning ───────────────────────────────── */}
          <div className="glass-card rounded-xl p-4 sm:p-6 animate-fade-in">
            <div className="mb-5">
              <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-red-500" />
                Predictive Churn Warning
              </h3>
              <p className="text-sm text-muted-foreground font-body mt-1">
                Customers statistically likely to never return — ranked by a composite risk score combining last rating, sentiment, recency, and loyalty history
              </p>
            </div>
            <ChurnWarningPanel data={churnRisks} isLoading={isChurnLoading} />
          </div>

          {/* ── Menu Item Lifecycle Tracker ───────────────────────────── */}
          <div className="glass-card rounded-xl p-4 sm:p-6 animate-fade-in">
            <div className="mb-5">
              <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-500" />
                Menu Item Lifecycle Tracker
              </h3>
              <p className="text-sm text-muted-foreground font-body mt-1">
                Week-over-week sentiment velocity per dish and aspect — not just where things stand, but which direction they&apos;re heading
              </p>
            </div>
            <MenuLifecycleChart data={menuLifecycle} isLoading={isLifecycleLoading} />
          </div>

          {/* ── Competitor Benchmarking ───────────────────────────────── */}
          <div className="glass-card rounded-xl p-4 sm:p-6 animate-fade-in">
            <div className="mb-5">
              <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Competitor Benchmarking
              </h3>
              <p className="text-sm text-muted-foreground font-body mt-1">
                Cross-restaurant radar comparison across 5 weighted dimensions — Food Quality, Service, Hygiene, Value, and Ambiance
              </p>
            </div>
            <CompetitorBenchmark
              data={competitorBenchmark}
              selectedRestaurantName={selectedRestaurant?.name}
              isLoading={isBenchmarkLoading}
            />
          </div>



          {/* Recent Reviews */}
          <div className="glass-card rounded-xl p-6 animate-fade-in">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              {selectedRestaurant ? `${selectedRestaurant.name} - Recent Reviews` : "Recent Reviews"}
            </h3>
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div key={review.id} className="flex items-start gap-4 p-4 rounded-lg bg-background/50 border border-border/50">
                  <div className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center text-primary-foreground text-sm font-semibold font-body shrink-0">
                    {review.customerName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground font-body text-sm">{review.customerName}</span>
                      <SentimentBadge sentiment={review.sentiment} />
                      <span className="text-xs text-muted-foreground font-body ml-auto">{review.date}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteReview(review.id)} 
                        className="text-muted-foreground hover:text-red-500 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
      </div>

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

      {/* Report Timeframe Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-display">Select Report Timeframe</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="font-body">Choose Time Period</Label>
              <div className="grid gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timeframe"
                    checked={reportTimeframe === "today"}
                    onChange={() => setReportTimeframe("today")}
                    className="w-4 h-4"
                  />
                  <span className="font-body">Current Day Report</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timeframe"
                    checked={reportTimeframe === "lastNDays"}
                    onChange={() => setReportTimeframe("lastNDays")}
                    className="w-4 h-4"
                  />
                  <span className="font-body">Last N Days Report</span>
                </label>
                {reportTimeframe === "lastNDays" && (
                  <div className="ml-6 mt-2">
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={lastNDays}
                      onChange={(e) => setLastNDays(parseInt(e.target.value) || 7)}
                      placeholder="Enter number of days"
                      className="w-48"
                    />
                    <p className="text-xs text-muted-foreground mt-1 font-body">Enter the number of days (e.g., 7, 30, 90)</p>
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="radio"
                    name="timeframe"
                    checked={reportTimeframe === "custom"}
                    onChange={() => setReportTimeframe("custom")}
                    className="w-4 h-4"
                  />
                  <span className="font-body">Custom Date Range Report</span>
                </label>
                {reportTimeframe === "custom" && (
                  <div className="ml-6 mt-2 space-y-2">
                    <div>
                      <Label className="text-sm font-body">Start Date</Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-body">End Date</Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setIsReportDialogOpen(false)}
              className="font-body"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setIsReportDialogOpen(false);
                handleDownloadReport();
              }}
              className="font-body"
            >
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerDashboard;
