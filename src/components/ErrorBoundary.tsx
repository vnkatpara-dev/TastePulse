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
            <h2 className="font-display text-2xl font-bold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground font-body">
              An unexpected error occurred. Please reload to restore the session.
            </p>
            {this.state.error && (
              <p className="text-xs font-mono p-3 rounded-lg bg-card border text-destructive/80 text-left overflow-x-auto">
                {this.state.error.message}
              </p>
            )}
            <Button onClick={this.handleReset} className="w-full gradient-amber text-primary-foreground font-body font-semibold">
              <RotateCcw className="w-4 h-4 mr-2" /> Reload TastePulse
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
