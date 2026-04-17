"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, startTransition } from "react";
import {
  Map,
  Navigation,
  LayoutDashboard,
  User,
  Settings,
  Shield,
  LogIn,
  LogOut,
  Moon,
  Sun,
  Monitor,
  ChevronDown,
  Zap,
  Menu,
  X,
  Car,
} from "lucide-react";
import type { UserPlan, UserRole } from "@/lib/legal/consent";

interface HeaderProps {
  userPlan?: UserPlan;
  userRole?: UserRole;
  userName?: string;
  isAuthenticated?: boolean;
}

const PLAN_COLORS: Record<UserPlan, string> = {
  free: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  lite: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  pro: "bg-[var(--primary-light)] text-[var(--primary)]",
};

export function Header({
  userPlan,
  userRole,
  userName,
  isAuthenticated = false,
}: HeaderProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { startTransition(() => setMounted(true)); }, []);

  const isAdmin =
    userRole === "admin" || userRole === "super_admin";

  function switchLocale(newLocale: string) {
    // Replace /de/ or /en/ with the new locale
    const newPath = pathname.replace(/^\/(de|en)/, `/${newLocale}`);
    router.push(newPath);
  }

  const navLinks = [
    { href: `/${locale}/dashboard`, label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: `/${locale}/map`, label: t("nav.map"), icon: Map },
    { href: `/${locale}/route`, label: t("nav.route"), icon: Navigation },
    { href: `/${locale}/profile`, label: t("nav.vehicles"), icon: Car },
  ];

  const themeIcon = !mounted ? (
    <Monitor size={16} />
  ) : theme === "dark" ? (
    <Moon size={16} />
  ) : theme === "light" ? (
    <Sun size={16} />
  ) : (
    <Monitor size={16} />
  );

  function cycleTheme() {
    setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark");
  }

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-page)]/90 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href={`/${locale}/map`}
          className="flex items-center gap-2 shrink-0 group"
        >
          <Image
            src="/logo.svg"
            alt="LadeKompass Logo"
            width={28}
            height={28}
            className="group-hover:scale-105 transition-transform"
          />
          <span className="font-black text-base tracking-tight text-[var(--text-base)]">
            Lade<span className="text-[var(--primary)]">Kompass</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--primary-light)] text-[var(--primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                <link.icon size={15} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Plan badge */}
          {isAuthenticated && userPlan && (
            <Link
              href={`/${locale}/upgrade`}
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${PLAN_COLORS[userPlan]}`}
            >
              <Zap size={10} />
              {userPlan}
            </Link>
          )}

          {/* Theme toggle */}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--bg-elevated)] transition-colors"
            title="Theme wechseln"
          >
            {themeIcon}
          </button>

          {/* Language switcher */}
          <div className="relative group">
            <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--bg-elevated)] transition-colors uppercase">
              {locale}
              <ChevronDown size={12} />
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-50 min-w-[80px]">
              {["de", "en"].map((l) => (
                <button
                  key={l}
                  onClick={() => switchLocale(l)}
                  className={`px-4 py-2 text-xs font-bold uppercase text-left transition-colors ${
                    l === locale
                      ? "text-[var(--primary)] bg-[var(--primary-light)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-base)]"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Auth links */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-1">
              {isAdmin && (
                <Link
                  href={`/${locale}/admin`}
                  className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors"
                  title={t("nav.admin")}
                >
                  <Shield size={16} />
                </Link>
              )}
              <Link
                href={`/${locale}/settings`}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--bg-elevated)] transition-colors"
                title={t("nav.settings")}
              >
                <Settings size={16} />
              </Link>
              <Link
                href={`/${locale}/profile`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <User size={15} />
                <span className="max-w-[100px] truncate">{userName}</span>
              </Link>
              <form action={`/${locale}/auth/logout`} method="POST">
                <button
                  type="submit"
                  className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  title={t("nav.logout")}
                >
                  <LogOut size={16} />
                </button>
              </form>
            </div>
          ) : (
            <Link
              href={`/${locale}/auth/login`}
              className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-hover)] transition-colors"
            >
              <LogIn size={14} />
              {t("nav.login")}
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <link.icon size={16} />
              {link.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <Link
              href={`/${locale}/auth/login`}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors"
            >
              <LogIn size={16} />
              {t("nav.login")}
            </Link>
          )}
          {isAuthenticated && (
            <>
              <Link
                href={`/${locale}/profile`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <User size={16} />
                {t("nav.profile")}
              </Link>
              <Link
                href={`/${locale}/settings`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <Settings size={16} />
                {t("nav.settings")}
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
