import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  public handleReset = () => {
    try {
      localStorage.removeItem("tastepulse_restaurants_store");
      localStorage.removeItem("tastepulse_reviews_store");
      sessionStorage.clear();
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full glass-card p-8 rounded-2xl border border-amber-500/30 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">Session Needs Refresh</h2>
            <p className="text-sm text-muted-foreground font-body">
              An unexpected state transition occurred. Click below to restore your TastePulse session.
            </p>
            {this.state.error && (
              <p className="text-xs font-mono p-3 rounded-lg bg-card border text-destructive/80 text-left overflow-x-auto">
                {this.state.error.message}
              </p>
            )}
            <div className="space-y-2 pt-2">
              <Button onClick={this.handleReload} className="w-full gradient-amber text-primary-foreground font-body font-semibold">
                <RotateCcw className="w-4 h-4 mr-2" /> Return to Home
              </Button>
              <Button onClick={this.handleReset} variant="outline" className="w-full text-xs font-body text-muted-foreground hover:text-foreground">
                Reset Demo Data & Restore Defaults
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
