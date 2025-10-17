"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { useRipple, RippleContainer } from "@/lib/animations/ripple";

interface BankListItemProps {
  bankName: string;
  bankLogo?: string;
  onClick?: () => void;
  className?: string;
}

export const BankListItem = forwardRef<HTMLButtonElement, BankListItemProps>(
  ({ bankName, bankLogo, onClick, className }, ref) => {
    const { ripples, createRipple } = useRipple();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      createRipple(e);
      onClick?.();
    };

    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={cn(
          // Container
          "relative w-full h-[72px] flex items-center gap-4",
          "px-[var(--spacing-16)] py-[var(--spacing-16)]",
          "bg-surface text-on-surface",
          // Hover and focus states
          "hover:bg-[hsl(var(--md-sys-color-on-surface)/0.08)]",
          "focus:bg-[hsl(var(--md-sys-color-on-surface)/0.12)]",
          "active:bg-[hsl(var(--md-sys-color-primary)/0.12)]",
          // Transitions
          "transition-colors duration-[var(--md-sys-motion-duration-short)]",
          // Focus ring
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--md-sys-color-secondary))] focus-visible:ring-offset-2",
          // Accessibility
          "cursor-pointer overflow-hidden",
          className
        )}
        type="button"
        aria-label={`Connect with ${bankName}`}
      >
        <RippleContainer ripples={ripples} />
        {/* Bank Logo */}
        {bankLogo ? (
          <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-muted">
            <img src={bankLogo} alt={`${bankName} logo`} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">{bankName.charAt(0).toUpperCase()}</span>
          </div>
        )}

        {/* Bank Name */}
        <span className="flex-1 text-left text-base leading-6 font-normal text-on-surface">{bankName}</span>

        {/* Trailing Chevron Icon */}
        <ChevronRight className="w-6 h-6 text-on-surface-variant flex-shrink-0" aria-hidden="true" />
      </button>
    );
  }
);

BankListItem.displayName = "BankListItem";
