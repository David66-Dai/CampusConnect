"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessageSquare,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import { fetchUnreadCount } from "@/services/messages";
import type { MessageKey } from "@/i18n/messages";
import { getInitials } from "@/utils/avatar";

type NavItem = {
  labelKey: MessageKey;
  href: string;
  icon: typeof LayoutDashboard;
};

const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.home", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "nav.events", href: "/events", icon: CalendarDays },
  { labelKey: "nav.connect", href: "/connect", icon: Users },
  { labelKey: "nav.marketplace", href: "/marketplace", icon: ShoppingBag },
  { labelKey: "nav.community", href: "/community", icon: MessageSquare },
  { labelKey: "nav.messages", href: "/messages", icon: MessageCircle },
];

/**
 * 登录后页面的通用外壳：顶部导航 + 内容区。
 * 未登录访问时自动重定向到 /login。
 */
export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { t } = useI18n();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-count"],
    queryFn: fetchUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 20_000,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-secondary/40">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold tracking-tight"
            >
              <BrandLogo />
              <span className="hidden sm:inline">
                Campus<span className="text-primary">Connect</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname.startsWith(item.href) ||
                  (item.href === "/marketplace" &&
                    pathname.startsWith("/product"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden md:inline">{t(item.labelKey)}</span>
                    {item.href === "/messages" && unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {user.xp} XP
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label={t("nav.settings")}
              title={t("nav.settings")}
            >
              <Link href="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
              title={t("nav.profile")}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium lg:inline">
                {user.name}
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("nav.logout")}
              title={t("nav.logout")}
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
