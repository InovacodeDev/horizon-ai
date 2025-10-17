"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Link2, Package, PieChart, FileText, ShoppingBag, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NavigationBar, NavigationBarItem } from "@/components/ui/navigation-bar";
import {
  NavigationDrawer,
  NavigationDrawerContent,
  NavigationDrawerHeader,
  NavigationDrawerFooter,
  NavigationDrawerItem,
} from "@/components/ui/navigation-drawer";
import { Button } from "@/components/ui/button";

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

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <>
      {/* Desktop Navigation - Top Bar */}
      <nav
        className={cn(
          "hidden md:flex items-center justify-between",
          "sticky top-0 z-50",
          "bg-[hsl(var(--md-sys-color-surface-container))]",
          "border-b border-[hsl(var(--md-sys-color-outline-variant))]",
          "px-4 lg:px-8",
          "h-16"
        )}
      >
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8",
              "bg-[hsl(var(--md-sys-color-primary))]",
              "rounded-[var(--md-sys-shape-corner-medium)]",
              "flex items-center justify-center"
            )}
          >
            <span className={cn("text-[hsl(var(--md-sys-color-on-primary))]", "font-bold text-lg")}>H</span>
          </div>
          <span className={cn("text-xl font-bold", "text-[hsl(var(--md-sys-color-on-surface))]", "hidden lg:inline")}>
            Horizon AI
          </span>
        </Link>

        {/* Desktop Navigation Bar */}
        <NavigationBar position="top" className="flex-1 max-w-3xl mx-8 border-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <NavigationBarItem
                key={item.id}
                icon={<Icon />}
                label={item.label}
                active={isActive}
                onClick={() => handleNavigation(item.href)}
              />
            );
          })}
        </NavigationBar>

        {/* Logout Button */}
        <Button variant="text" onClick={handleLogout} className="gap-2 shrink-0">
          <LogOut size={18} />
          <span className="hidden lg:inline">Sair</span>
        </Button>
      </nav>

      {/* Mobile Navigation - Drawer */}
      <nav
        className={cn(
          "md:hidden flex items-center justify-between",
          "sticky top-0 z-50",
          "bg-[hsl(var(--md-sys-color-surface-container))]",
          "border-b border-[hsl(var(--md-sys-color-outline-variant))]",
          "px-4",
          "h-16"
        )}
      >
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8",
              "bg-[hsl(var(--md-sys-color-primary))]",
              "rounded-[var(--md-sys-shape-corner-medium)]",
              "flex items-center justify-center"
            )}
          >
            <span className={cn("text-[hsl(var(--md-sys-color-on-primary))]", "font-bold text-lg")}>H</span>
          </div>
          <span className={cn("text-xl font-bold", "text-[hsl(var(--md-sys-color-on-surface))]")}>Horizon AI</span>
        </Link>

        {/* Mobile Menu Button */}
        <Button variant="text" onClick={() => setMobileMenuOpen(true)} className="shrink-0" aria-label="Abrir menu">
          <LayoutDashboard size={24} />
        </Button>
      </nav>

      {/* Mobile Navigation Drawer */}
      <NavigationDrawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} variant="modal" side="left">
        <NavigationDrawerHeader>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8",
                "bg-[hsl(var(--md-sys-color-primary))]",
                "rounded-[var(--md-sys-shape-corner-medium)]",
                "flex items-center justify-center"
              )}
            >
              <span className={cn("text-[hsl(var(--md-sys-color-on-primary))]", "font-bold text-lg")}>H</span>
            </div>
            <span className={cn("text-lg font-bold", "text-[hsl(var(--md-sys-color-on-surface))]")}>Horizon AI</span>
          </div>
        </NavigationDrawerHeader>

        <NavigationDrawerContent>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <NavigationDrawerItem
                key={item.id}
                icon={<Icon />}
                label={item.label}
                active={isActive}
                onClick={() => handleNavigation(item.href)}
              />
            );
          })}
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
