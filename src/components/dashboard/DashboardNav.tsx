"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  NavigationDrawer,
  NavigationDrawerContent,
  NavigationDrawerHeader,
  NavigationDrawerFooter,
} from "@/components/ui/navigation-drawer";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";

const navItems = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { id: "connections", label: "Conexões", href: "/connections", icon: "Link2" },
  { id: "assets", label: "Ativos", href: "/assets", icon: "Package" },
  { id: "portfolio", label: "Portfólio", href: "/portfolio", icon: "PieChart" },
  { id: "irpf", label: "IRPF", href: "/irpf", icon: "FileText" },
  { id: "marketplace", label: "Marketplace", href: "/marketplace", icon: "ShoppingBag" },
];

interface DashboardNavProps {
  userEmail?: string;
  userName?: string;
}

export function DashboardNav({ userEmail = "user@example.com", userName = "User" }: DashboardNavProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    setMobileMenuOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <Sidebar userEmail={userEmail} userName={userName} />

      {/* Desktop Header */}
      <header
        className={cn(
          "hidden md:flex items-center justify-between",
          "fixed top-0 right-0 left-0 md:left-64 z-40",
          "bg-[hsl(var(--md-sys-color-surface-container))]",
          "border-b border-[hsl(var(--md-sys-color-outline-variant))]",
          "px-6 h-64"
        )}
      >
        {/* Spacer */}
        <div className="flex-1" />

        {/* Avatar Menu */}
        <div className="relative">
          <button
            onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-[var(--md-sys-shape-corner-small)]",
              "transition-colors duration-[var(--md-sys-motion-duration-short2)]",
              "hover:bg-[hsl(var(--md-sys-color-on-surface)/0.08)]",
              avatarMenuOpen && "bg-[hsl(var(--md-sys-color-on-surface)/0.12)]"
            )}
          >
            <div
              className={cn(
                "w-32 h-32",
                "bg-[hsl(var(--md-sys-color-secondary))]",
                "rounded-full",
                "flex items-center justify-center",
                "text-[hsl(var(--md-sys-color-on-secondary))]",
                "font-semibold text-xs"
              )}
            >
              {getInitials(userName)}
            </div>
          </button>

          {/* Dropdown Menu */}
          {avatarMenuOpen && (
            <div
              className={cn(
                "absolute top-full right-0 mt-2",
                "bg-[hsl(var(--md-sys-color-surface))]",
                "border border-[hsl(var(--md-sys-color-outline-variant))]",
                "rounded-[var(--md-sys-shape-corner-small)]",
                "shadow-lg",
                "overflow-hidden",
                "min-w-[200px]"
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
                  "transition-colors duration-[var(--md-sys-motion-duration-short2)]"
                )}
              >
                <LogOut size={18} />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Header */}
      <header
        className={cn(
          "md:hidden flex items-center justify-between",
          "fixed top-0 left-0 right-0 z-40",
          "bg-[hsl(var(--md-sys-color-surface-container))]",
          "border-b border-[hsl(var(--md-sys-color-outline-variant))]",
          "px-4 h-64"
        )}
      >
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8",
              "bg-[hsl(var(--md-sys-color-primary))]",
              "rounded-[var(--md-sys-shape-corner-small)]",
              "flex items-center justify-center"
            )}
          >
            <span className={cn("text-[hsl(var(--md-sys-color-on-primary))]", "font-bold text-lg")}>H</span>
          </div>
          <span className={cn("text-lg font-bold", "text-[hsl(var(--md-sys-color-on-surface))]")}>Horizon</span>
        </Link>

        {/* Menu Button */}
        <Button variant="text" onClick={() => setMobileMenuOpen(true)} className="shrink-0" aria-label="Abrir menu">
          <Menu size={24} />
        </Button>
      </header>

      {/* Mobile Navigation Drawer */}
      <NavigationDrawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} variant="modal" side="left">
        <NavigationDrawerHeader>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8",
                "bg-[hsl(var(--md-sys-color-primary))]",
                "rounded-[var(--md-sys-shape-corner-small)]",
                "flex items-center justify-center"
              )}
            >
              <span className={cn("text-[hsl(var(--md-sys-color-on-primary))]", "font-bold text-lg")}>H</span>
            </div>
            <span className={cn("text-lg font-bold", "text-[hsl(var(--md-sys-color-on-surface))]")}>Horizon AI</span>
          </div>
        </NavigationDrawerHeader>

        <NavigationDrawerContent>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-[var(--md-sys-shape-corner-small)]",
                "text-left transition-colors duration-[var(--md-sys-motion-duration-short2)]",
                "text-[hsl(var(--md-sys-color-on-surface-variant))]",
                "hover:bg-[hsl(var(--md-sys-color-on-surface)/0.08)]"
              )}
            >
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </NavigationDrawerContent>

        <NavigationDrawerFooter>
          <Button
            variant="text"
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="w-full justify-start gap-3"
          >
            <LogOut size={18} />
            Sair
          </Button>
        </NavigationDrawerFooter>
      </NavigationDrawer>
    </>
  );
}
