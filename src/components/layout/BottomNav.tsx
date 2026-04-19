"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Map, Navigation, LayoutDashboard, User, Settings, ShieldCheck, BookOpen } from "lucide-react";

interface BottomNavProps {
  isAuthenticated?: boolean;
  userRole?: "driver" | "fleet_manager" | "admin" | "super_admin";
}

export function BottomNav({ isAuthenticated = false, userRole }: BottomNavProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  const isAdmin = userRole === "admin" || userRole === "super_admin";

  const tabs = [
    { href: `/${locale}/map`, label: t("map"), icon: Map },
    { href: `/${locale}/route`, label: t("route"), icon: Navigation },
    ...(isAuthenticated
      ? [
          { href: `/${locale}/dashboard`, label: t("dashboard"), icon: LayoutDashboard },
          { href: `/${locale}/trips`, label: "Fahrten", icon: BookOpen },
          { href: `/${locale}/profile`, label: t("profile"), icon: User },
          ...(isAdmin
            ? [{ href: `/${locale}/admin`, label: t("admin"), icon: ShieldCheck }]
            : [{ href: `/${locale}/settings`, label: t("settings"), icon: Settings }]
          ),
        ]
      : []),
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-md border-t border-[var(--border)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Hauptnavigation"
    >
      <div className="flex items-stretch h-14">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-wide transition-colors min-w-0 ${
                isActive
                  ? "text-[var(--primary)]"
                  : "text-[var(--text-muted)] active:text-[var(--text-base)]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <tab.icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                className="shrink-0"
              />
              <span className="truncate max-w-full px-0.5 leading-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
