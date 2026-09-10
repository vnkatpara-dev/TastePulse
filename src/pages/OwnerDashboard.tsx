import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { MessageSquare, TrendingUp, ThumbsUp, ThumbsDown, LogOut, Star, Loader2, Plus, Pencil, Trash2, X, Download, Lightbulb, ChefHat, AlertTriangle, CheckCircle, Users, BarChart2, Trophy, Sparkles, ArrowRight, ShieldAlert, Bot, MessageCircleReply, CornerDownLeft, Copy, Check, Send, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatCard from "@/components/StatCard";
import SentimentBadge from "@/components/SentimentBadge";
import StarRating from "@/components/StarRating";
import ChurnWarningPanel from "@/components/ChurnWarningPanel";
import MenuLifecycleChart from "@/components/MenuLifecycleChart";
import CompetitorBenchmark from "@/components/CompetitorBenchmark";
import { getAnalytics, getReviews, getSentimentTrend, getCategoryBreakdown, getRestaurants, addRestaurant, deleteRestaurant, updateRestaurant, deleteReview, getDishInsights, getChurnRisks, getMenuLifecycle, getCompetitorBenchmark, addReplyToReview, Review, Analytics, SentimentTrend, CategoryBreakdown, Restaurant, DishInsight, ChurnRisk, MenuLifecycleItem, CompetitorBenchmarkItem } from "@/services/api";
import { askChefCopilot, auditHealthSafetyRisks, generateSmartReply, ChefCopilotAnswer, HealthSafetyAudit } from "@/services/geminiService";
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

  // Gemini AI Operations states
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotAnswer, setCopilotAnswer] = useState<ChefCopilotAnswer | null>(null);
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);

  const [isHealthAuditOpen, setIsHealthAuditOpen] = useState(false);
  const [healthAudit, setHealthAudit] = useState<HealthSafetyAudit | null>(null);
  const [isHealthAuditLoading, setIsHealthAuditLoading] = useState(false);

  const [replyingReview, setReplyingReview] = useState<Review | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyTone, setReplyTone] = useState<"warm" | "professional" | "concise">("warm");
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isSavingReply, setIsSavingReply] = useState(false);

  // Reviews stream filtering & pagination
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewSentimentFilter, setReviewSentimentFilter] = useState<"all" | "positive" | "negative" | "neutral">("all");
  const [visibleReviewCount, setVisibleReviewCount] = useState(10);

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

  // Search & sentiment filtered reviews
  const searchedReviews = filteredReviews.filter(r => {
    const matchesSentiment = reviewSentimentFilter === "all" || r.sentiment === reviewSentimentFilter;
    const searchLower = reviewSearch.trim().toLowerCase();
    const matchesSearch = !searchLower || 
      (r.customerName || "").toLowerCase().includes(searchLower) ||
      (r.text || "").toLowerCase().includes(searchLower) ||
      (r.category || "").toLowerCase().includes(searchLower) ||
      (r.restaurantName || "").toLowerCase().includes(searchLower);
    return matchesSentiment && matchesSearch;
  });
  const displayedReviews = searchedReviews.slice(0, visibleReviewCount);

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
        const target = restaurants.find(r => r.id === restaurantId);
        const targetName = target?.name?.trim().toLowerCase();

        await deleteRestaurant(restaurantId);
        toast.success("Restaurant deleted successfully");

        // Clear selection if deleted restaurant was selected
        if (selectedRestaurant?.id === restaurantId || (targetName && selectedRestaurant?.name?.trim().toLowerCase() === targetName)) {
          setSelectedRestaurant(null);
        }

        // Refresh restaurants list
        const restaurantsData = await getRestaurants();
        setRestaurants(restaurantsData);

        // Refresh analytics and reviews
        const [analyticsData, reviewsData] = await Promise.all([
          getAnalytics().catch(() => null),
          getReviews().catch(() => [])
        ]);
        setAnalytics(analyticsData);
        setReviews(reviewsData);

        // Refresh aux data
        fetchInsights();
        fetchChurn();
        fetchLifecycle();
        fetchBenchmark();
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
    setVisibleReviewCount(10);
    setReviewSearch("");
    setReviewSentimentFilter("all");
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

  // ─── GEMINI AI OPERATIONS HANDLERS ────────────────────────────────────────

  const handleAskCopilot = async (overrideQuery?: string) => {
    const q = (overrideQuery || copilotInput).trim();
    if (!q) {
      toast.error("Please enter a question for the Chef Copilot");
      return;
    }
    if (overrideQuery) setCopilotInput(overrideQuery);
    setIsCopilotLoading(true);
    setCopilotAnswer(null);
    try {
      const ans = await askChefCopilot(
        q,
        filteredReviews,
        selectedRestaurant?.name || "The Golden Fork"
      );
      setCopilotAnswer(ans);
    } catch (err) {
      console.error("Chef Copilot failed:", err);
      toast.error("Failed to get answer from Chef Copilot. Please retry.");
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const handleOpenHealthAudit = async () => {
    setIsHealthAuditOpen(true);
    if (healthAudit) return; // already loaded once
    setIsHealthAuditLoading(true);
    try {
      const res = await auditHealthSafetyRisks(
        filteredReviews,
        selectedRestaurant?.name || "The Golden Fork"
      );
      setHealthAudit(res);
    } catch (err) {
      console.error("Health safety audit failed:", err);
      toast.error("Failed to run health pre-audit.");
    } finally {
      setIsHealthAuditLoading(false);
    }
  };

  const handleStartReply = async (review: Review) => {
    setReplyingReview(review);
    setReplyDraft(review.ownerReply || "");
    setReplyTone("warm");
    if (!review.ownerReply) {
      setIsGeneratingReply(true);
      try {
        const text = await generateSmartReply(
          review,
          selectedRestaurant?.name || "The Golden Fork",
          "warm"
        );
        setReplyDraft(text);
      } catch (err) {
        console.error("Failed to generate draft reply:", err);
      } finally {
        setIsGeneratingReply(false);
      }
    }
  };

  const handleRegenerateReplyWithTone = async (tone: "warm" | "professional" | "concise") => {
    if (!replyingReview) return;
    setReplyTone(tone);
    setIsGeneratingReply(true);
    try {
      const text = await generateSmartReply(
        replyingReview,
        selectedRestaurant?.name || "The Golden Fork",
        tone
      );
      setReplyDraft(text);
    } catch (err) {
      console.error("Regenerate reply failed:", err);
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleSaveReply = async () => {
    if (!replyingReview || !replyDraft.trim()) {
      toast.error("Please enter a reply message");
      return;
    }
    setIsSavingReply(true);
    try {
      await addReplyToReview(replyingReview.id, replyDraft.trim());
      toast.success("Owner reply posted successfully!");
      // Update local reviews
      const updated = await getReviews();
      setReviews(updated);
      setReplyingReview(null);
    } catch (err) {
      console.error("Failed to save reply:", err);
      toast.error("Failed to save reply");
    } finally {
      setIsSavingReply(false);
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenHealthAudit}
              className="font-body text-xs border-red-300 dark:border-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5"
            >
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span className="hidden sm:inline">Health Pre-Audit</span>
            </Button>
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

          {/* ── Chef Copilot ("Ask Your Restaurant Anything") ──────────── */}
          <div className="glass-card rounded-xl p-4 sm:p-6 animate-fade-in border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-background space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                    TastePulse Chef &amp; GM Copilot
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                      Gemini 3.6 Flash
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground font-body">
                    Semantic Q&amp;A powered by real guest sentiment. Inquire about food quality, kitchen delays, staff, or trends.
                  </p>
                </div>
              </div>
            </div>

            {/* Input bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  value={copilotInput}
                  onChange={(e) => setCopilotInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isCopilotLoading) {
                      handleAskCopilot();
                    }
                  }}
                  placeholder="Ask your restaurant: e.g. Why did Friday dinner ratings drop? What do guests say about steak?"
                  className="font-body text-xs sm:text-sm pl-9 pr-4 py-5 rounded-lg border-border/80 focus-visible:ring-amber-500"
                />
                <Sparkles className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <Button
                onClick={() => handleAskCopilot()}
                disabled={isCopilotLoading}
                className="gradient-amber text-white font-semibold text-xs sm:text-sm h-10 px-4 shrink-0 gap-1.5"
              >
                {isCopilotLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <CornerDownLeft className="w-4 h-4" />
                    <span>Ask AI</span>
                  </>
                )}
              </Button>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex items-center gap-2 flex-wrap text-xxs font-body">
              <span className="text-muted-foreground font-semibold">Try asking:</span>
              {[
                "Why are diners leaving negative reviews?",
                "What do guests say about pasta & steak quality?",
                "How is weekend floor service speed performing?",
                "What are the top compliments about ambiance?"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskCopilot(chip)}
                  className="px-2.5 py-1 rounded-full bg-background border border-border/60 hover:border-amber-500/50 hover:bg-amber-500/5 text-muted-foreground hover:text-foreground transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Copilot Answer Card */}
            {copilotAnswer && (
              <div className="p-4 rounded-xl bg-card border border-amber-500/30 space-y-3 animate-fade-in">
                <div className="flex items-start justify-between gap-2 border-b border-border/40 pb-2">
                  <div>
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                      Executive Summary
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed mt-0.5">
                      {copilotAnswer.summary}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Key Factors */}
                  {copilotAnswer.keyFactors?.length > 0 && (
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-1.5">
                      <span className="font-bold text-foreground text-[11px] block">Key Drivers Identified:</span>
                      <ul className="space-y-1 text-muted-foreground">
                        {copilotAnswer.keyFactors.map((fact, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Supporting Quotes */}
                  {copilotAnswer.supportingQuotes?.length > 0 && (
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-1.5">
                      <span className="font-bold text-foreground text-[11px] block">Grounded Guest Quotes:</span>
                      <ul className="space-y-1 text-muted-foreground italic">
                        {copilotAnswer.supportingQuotes.map((quote, idx) => (
                          <li key={idx} className="text-xxs leading-relaxed">
                            &ldquo;{quote}&rdquo;
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Immediate Action */}
                {copilotAnswer.suggestedImmediateAction && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block">
                        Highest Impact Immediate Action
                      </span>
                      <p className="text-xs text-emerald-950 dark:text-emerald-200 mt-0.5">
                        {copilotAnswer.suggestedImmediateAction}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
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
                    const total = insight.count || 1;
                    const posPercent = Math.round(((insight.sentiment?.positive ?? 0) / total) * 100);
                    const negPercent = Math.round(((insight.sentiment?.negative ?? 0) / total) * 100);
                    const neuPercent = Math.max(0, 100 - posPercent - negPercent);
                    
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
                          const neg = insight.sentiment?.negative ?? 0;
                          const pos = insight.sentiment?.positive ?? 0;
                          const count = insight.count || 1;
                          const negRatio = neg / count;
                          
                          if (negRatio >= 0.25 || neg > pos) {
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
            <ChurnWarningPanel data={churnRisks} isLoading={isChurnLoading} restaurantName={selectedRestaurant?.name} />
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
            <MenuLifecycleChart data={menuLifecycle} isLoading={isLifecycleLoading} reviews={filteredReviews} />
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
          <div className="glass-card rounded-xl p-4 sm:p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                  {selectedRestaurant ? `${selectedRestaurant.name} - Reviews` : "Live Customer Reviews"}
                  <Badge variant="secondary" className="font-normal font-body text-xs">
                    {filteredReviews.length} total reviews
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground font-body mt-0.5">
                  Guest feedback stream with sentiment breakdown and AI instant response generator
                </p>
              </div>

              {/* Quick Sentiment Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-background/80 border border-border/60 rounded-lg text-xs font-body">
                {(["all", "positive", "neutral", "negative"] as const).map((s) => {
                  const count = s === "all" 
                    ? filteredReviews.length 
                    : filteredReviews.filter(r => r.sentiment === s).length;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        setReviewSentimentFilter(s);
                        setVisibleReviewCount(10);
                      }}
                      className={`px-2.5 py-1 rounded capitalize transition-all font-medium flex items-center gap-1.5 ${
                        reviewSentimentFilter === s
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{s}</span>
                      <span className="text-[10px] opacity-80 px-1.5 py-0.2 rounded-full bg-foreground/10 font-bold">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Keyword Search Bar */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search vast reviews by dish, keywords, customer name..."
                value={reviewSearch}
                onChange={(e) => {
                  setReviewSearch(e.target.value);
                  setVisibleReviewCount(10);
                }}
                className="pl-9 text-xs h-9 bg-background/60"
              />
            </div>

            <div className="space-y-4">
              {displayedReviews.map((review) => (
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
                    
                    {/* Render existing owner reply if present */}
                    {review.ownerReply && (
                      <div className="mt-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                        <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-bold mb-1 text-[11px]">
                          <span className="flex items-center gap-1.5"><MessageCircleReply className="w-3.5 h-3.5" /> Owner Reply</span>
                          <span className="text-[10px] text-muted-foreground font-normal">{review.ownerReplyDate}</span>
                        </div>
                        <p className="text-foreground/90 font-sans italic leading-relaxed">{review.ownerReply}</p>
                      </div>
                    )}

                    {/* AI Reply Action */}
                    <div className="mt-3 flex items-center justify-between pt-1 border-t border-border/30">
                      <span className="text-xxs text-muted-foreground">
                        {review.ownerReply ? "Replied to guest" : "Awaiting response"}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartReply(review)}
                        className="text-xs font-medium h-7 px-2.5 gap-1.5 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>{review.ownerReply ? "Edit Reply" : "✨ AI Reply"}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {displayedReviews.length === 0 && (
                <div className="text-center py-8 text-muted-foreground font-body text-sm">
                  {reviewSearch 
                    ? `No reviews matching "${reviewSearch}"` 
                    : selectedRestaurant 
                    ? `No reviews yet for ${selectedRestaurant.name}` 
                    : "No reviews yet"}
                </div>
              )}
            </div>

            {/* Pagination / Load More Footer */}
            {searchedReviews.length > displayedReviews.length && (
              <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs text-muted-foreground font-body">
                  Showing {displayedReviews.length} of {searchedReviews.length} reviews
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVisibleReviewCount(prev => prev + 10)}
                    className="text-xs font-body"
                  >
                    Load More (+10)
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVisibleReviewCount(searchedReviews.length)}
                    className="text-xs font-body text-primary"
                  >
                    Show All ({searchedReviews.length})
                  </Button>
                </div>
              </div>
            )}
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

      {/* Health Pre-Audit Dialog */}
      <Dialog open={isHealthAuditOpen} onOpenChange={setIsHealthAuditOpen}>
        <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-5 h-5" />
              <DialogTitle className="font-display text-lg">
                Food Safety &amp; Health Inspection Pre-Audit
              </DialogTitle>
            </div>
            <DialogDescription className="font-body text-xs text-muted-foreground">
              Autonomous health hazard scanner analyzing guest feedback for food safety &amp; hygiene red flags
            </DialogDescription>
          </DialogHeader>

          {isHealthAuditLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              <p className="font-body text-sm text-foreground font-medium">
                Scanning customer review corpus for allergen, temperature, &amp; hygiene red flags...
              </p>
              <p className="text-xs text-muted-foreground">Synthesizing compliance audit via Gemini 3.6 Flash</p>
            </div>
          ) : healthAudit ? (
            <div className="space-y-4 py-2 font-body text-xs">
              {/* Score card */}
              <div className="p-4 rounded-xl border bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Inspection Vulnerability Index
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                    healthAudit.riskLevel === 'critical'
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : healthAudit.riskLevel === 'moderate'
                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}>
                    {healthAudit.riskLevel} Risk ({healthAudit.inspectionVulnerabilityScore}/100)
                  </span>
                </div>
                
                {/* Meter */}
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${
                      healthAudit.inspectionVulnerabilityScore > 50
                        ? 'bg-red-500'
                        : healthAudit.inspectionVulnerabilityScore > 25
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${healthAudit.inspectionVulnerabilityScore}%` }}
                  />
                </div>
                <p className="text-muted-foreground text-xxs mt-1">
                  {healthAudit.summary}
                </p>
              </div>

              {/* Detected Risks */}
              {healthAudit.detectedRisks?.length > 0 ? (
                <div className="space-y-2">
                  <span className="font-bold text-foreground text-xs block">
                    Flagged Hazard Triggers:
                  </span>
                  <div className="space-y-2">
                    {healthAudit.detectedRisks.map((risk, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-red-800 dark:text-red-300 text-xs">
                            {risk.category}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded">
                            {risk.urgency}
                          </span>
                        </div>
                        <p className="text-red-950 dark:text-red-200 text-xs italic">
                          &ldquo;{risk.triggerQuote}&rdquo;
                        </p>
                        <p className="text-muted-foreground text-xxs">
                          {risk.riskDetails}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No critical health hazard triggers detected in the recent reviews!</span>
                </div>
              )}

              {/* Morning Checklist */}
              {healthAudit.morningChecklist?.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="font-bold text-foreground text-xs block">
                    Daily Opening Staff Checklist:
                  </span>
                  <div className="space-y-1.5">
                    {healthAudit.morningChecklist.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-start gap-2 text-xs">
                        <input type="checkbox" className="mt-0.5 rounded text-amber-600" />
                        <span className="text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* AI Smart Review Reply Dialog */}
      <Dialog open={!!replyingReview} onOpenChange={(open) => !open && setReplyingReview(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <MessageCircleReply className="w-5 h-5" />
              <DialogTitle className="font-display text-lg">
                Public Owner Response
              </DialogTitle>
            </div>
            <DialogDescription className="font-body text-xs text-muted-foreground">
              Reply to <strong>{replyingReview?.customerName}</strong> ({replyingReview?.rating}/5 stars)
            </DialogDescription>
          </DialogHeader>

          {replyingReview && (
            <div className="space-y-4 py-2 font-body text-xs">
              {/* Original Review */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-muted-foreground italic">
                &ldquo;{replyingReview.text}&rdquo;
              </div>

              {/* Tone Selector */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-xs">AI Tone:</span>
                <div className="flex gap-1.5">
                  {(["warm", "professional", "concise"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleRegenerateReplyWithTone(t)}
                      disabled={isGeneratingReply}
                      className={`capitalize px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                        replyTone === t
                          ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                          : "bg-background text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Draft Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Your Public Response:</span>
                  {isGeneratingReply && (
                    <span className="text-xxs text-amber-600 flex items-center gap-1 font-normal">
                      <Loader2 className="w-3 h-3 animate-spin" /> Generating...
                    </span>
                  )}
                </div>
                <Textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder="Write or refine your public response..."
                  rows={4}
                  className="font-body text-xs leading-relaxed"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReplyingReview(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveReply}
                  disabled={isSavingReply || !replyDraft.trim()}
                  className="text-xs gradient-amber text-white font-semibold gap-1.5"
                >
                  {isSavingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Post Public Reply</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerDashboard;
