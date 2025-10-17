"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Link2, Package, PieChart, FileText, ShoppingBag, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NavigationBar, NavigationBarItem } from "@/components/ui/navigation-bar";

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "connections",
    label: "Conexões",
    href: "/connections",
    icon: Link2,
  },
  {
    id: "assets",
    label: "Ativos",
    href: "/assets",
    icon: Package,
  },
  {
    id: "portfolio",
    label: "Portfólio",
    href: "/portfolio",
    icon: PieChart,
  },
  {
    id: "irpf",
    label: "IRPF",
    href: "/irpf",
    icon: FileText,
  },
  {
    id: "marketplace",
    label: "Marketplace",
    href: "/marketplace",
    icon: ShoppingBag,
  },
];

interface SidebarProps {
  userEmail?: string;
  userName?: string;
}

export function Sidebar({ userEmail = "user@example.com", userName = "User" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  // Get initials from user name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col",
        "fixed left-0 top-0 bottom-0 z-40",
        "w-64",
        "bg-[hsl(var(--md-sys-color-surface-container))]",
        "border-r border-[hsl(var(--md-sys-color-outline-variant))]",
        "pt-0"
      )}
    >
      {/* Logo Section */}
      <div
        className={cn(
          "flex items-center gap-3",
          "px-6 py-6",
          "border-b border-[hsl(var(--md-sys-color-outline-variant))]"
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-3 flex-1">
          <div
            className={cn(
              "w-10 h-10",
              "bg-[hsl(var(--md-sys-color-primary))]",
              "rounded-[var(--md-sys-shape-corner-small)]",
              "flex items-center justify-center flex-shrink-0"
            )}
          >
            <span className={cn("text-[hsl(var(--md-sys-color-on-primary))]", "font-bold text-lg")}>H</span>
          </div>
          <div className="flex flex-col">
            <span className={cn("text-lg font-bold", "text-[hsl(var(--md-sys-color-on-surface))]")}>Horizon</span>
            <span className={cn("text-xs", "text-[hsl(var(--md-sys-color-on-surface-variant))]")}>AI</span>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className={cn("flex-1", "px-3 py-6", "space-y-1 overflow-y-auto")}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3",
                "rounded-[var(--md-sys-shape-corner-small)]",
                "text-left",
                "transition-colors",
                "duration-[var(--md-sys-motion-duration-short2)]",
                "ease-[var(--md-sys-motion-easing-standard)]",
                isActive
                  ? cn("bg-[hsl(var(--md-sys-color-primary)/0.12)]", "text-[hsl(var(--md-sys-color-primary))]")
                  : cn(
                      "text-[hsl(var(--md-sys-color-on-surface-variant))]",
                      "hover:bg-[hsl(var(--md-sys-color-on-surface)/0.08)]"
                    )
              )}
            >
              <Icon
                size={20}
                className={cn(
                  "flex-shrink-0",
                  isActive
                    ? "text-[hsl(var(--md-sys-color-primary))]"
                    : "text-[hsl(var(--md-sys-color-on-surface-variant))]"
                )}
              />
              <span className={cn("text-sm font-medium", "flex-1")}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className={cn("px-3 py-4", "border-t border-[hsl(var(--md-sys-color-outline-variant))]")}>
        <div className="relative">
          <button
            onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3",
              "rounded-[var(--md-sys-shape-corner-small)]",
              "transition-colors",
              "duration-[var(--md-sys-motion-duration-short2)]",
              "ease-[var(--md-sys-motion-easing-standard)]",
              "hover:bg-[hsl(var(--md-sys-color-on-surface)/0.08)]",
              avatarMenuOpen && "bg-[hsl(var(--md-sys-color-on-surface)/0.12)]"
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "w-10 h-10",
                "bg-[hsl(var(--md-sys-color-secondary))]",
                "rounded-full",
                "flex items-center justify-center flex-shrink-0",
                "text-[hsl(var(--md-sys-color-on-secondary))]",
                "font-semibold text-sm"
              )}
            >
              {getInitials(userName)}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", "text-[hsl(var(--md-sys-color-on-surface))]", "truncate")}>
                {userName}
              </p>
              <p className={cn("text-xs", "text-[hsl(var(--md-sys-color-on-surface-variant))]", "truncate")}>
                {userEmail}
              </p>
            </div>

            {/* Chevron Icon */}
            <ChevronDown
              size={18}
              className={cn(
                "flex-shrink-0",
                "transition-transform",
                "duration-[var(--md-sys-motion-duration-short2)]",
                "ease-[var(--md-sys-motion-easing-standard)]",
                "text-[hsl(var(--md-sys-color-on-surface-variant))]",
                avatarMenuOpen && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown Menu */}
          {avatarMenuOpen && (
            <div
              className={cn(
                "absolute bottom-full left-3 right-3 mb-2",
                "bg-[hsl(var(--md-sys-color-surface))]",
                "border border-[hsl(var(--md-sys-color-outline-variant))]",
                "rounded-[var(--md-sys-shape-corner-small)]",
                "shadow-[var(--md-sys-elevation-level2)]",
                "overflow-hidden"
              )}
            >
              <button
                onClick={() => {
                  setAvatarMenuOpen(false);
                  handleLogout();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3",
                  "text-left text-sm font-medium",
                  "text-[hsl(var(--md-sys-color-on-surface))]",
                  "hover:bg-[hsl(var(--md-sys-color-on-surface)/0.08)]",
                  "transition-colors",
                  "duration-[var(--md-sys-motion-duration-short2)]",
                  "ease-[var(--md-sys-motion-easing-standard)]"
                )}
              >
                <LogOut size={18} className="flex-shrink-0" />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
