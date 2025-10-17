"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { logger } from "@/lib/logger";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error using structured logger
    logger.error("ErrorBoundary caught an error", error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[hsl(var(--md-sys-color-surface-container-low))]">
          <Card className="max-w-md w-full">
            <div className="text-center p-6">
              <h1 className="font-[family-name:var(--md-sys-typescale-headline-medium-font)] text-[length:var(--md-sys-typescale-headline-medium-size)] leading-[var(--md-sys-typescale-headline-medium-line-height)] font-[number:var(--md-sys-typescale-headline-medium-weight)] tracking-[var(--md-sys-typescale-headline-medium-tracking)] text-[hsl(var(--md-sys-color-on-surface))] mb-4">
                Algo deu errado
              </h1>
              <p className="font-[family-name:var(--md-sys-typescale-body-medium-font)] text-[length:var(--md-sys-typescale-body-medium-size)] leading-[var(--md-sys-typescale-body-medium-line-height)] font-[number:var(--md-sys-typescale-body-medium-weight)] tracking-[var(--md-sys-typescale-body-medium-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))] mb-6">
                Ocorreu um erro inesperado. Tente recarregar a página.
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="bg-[hsl(var(--md-sys-color-error-container))] border border-[hsl(var(--md-sys-color-error))] rounded-[var(--md-sys-shape-corner-small)] p-3 mb-6">
                  <p className="text-[length:var(--md-sys-typescale-body-small-size)] leading-[var(--md-sys-typescale-body-small-line-height)] font-[number:var(--md-sys-typescale-body-small-weight)] tracking-[var(--md-sys-typescale-body-small-tracking)] font-mono text-[hsl(var(--md-sys-color-on-error-container))] break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={this.handleReset} className="flex-1">
                  Tentar novamente
                </Button>
                <Button variant="outlined" onClick={() => (window.location.href = "/")} className="flex-1">
                  Voltar ao início
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
