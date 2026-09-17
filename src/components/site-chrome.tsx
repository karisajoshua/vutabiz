import { Link, useRouterState } from "@tanstack/react-router";
import {
  MessageCircle,
  Facebook,
  Instagram,
  Music2,
  LogOut,
  User,
  Menu,
  X,
  LayoutDashboard,
  ShieldAlert,
  HeartHandshake,
  MessagesSquare,
  Bell,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Heart,
  Globe,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n";

function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <div
        className={`grid h-10 w-10 place-items-center rounded-xl ${light ? "bg-white/15 ring-1 ring-white/30" : "bg-primary/10"}`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-6 w-6 ${light ? "text-white" : "text-primary"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 20l8-16 8 16" />
          <path d="M8 20l4-8 4 8" />
        </svg>
      </div>
      <div className="leading-tight">
        <div
          className={`font-extrabold tracking-tight text-lg ${light ? "text-white" : "text-foreground"}`}
        >
          Sokonyumbani
        </div>
        <div
          className={`text-[10px] uppercase tracking-[0.18em] ${light ? "text-white/70" : "text-muted-foreground"}`}
        >
          Local Market
        </div>
      </div>
    </Link>
  );
}

export function Header() {
  const { lang, setLanguage, t } = useLanguage();
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setEmail(data.user?.email ?? null);
      if (data.user) {
        const { data: r } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);
        setIsAdmin(!!r?.some((x) => x.role === "admin"));

        // Fetch wallet balance
        const { data: prof } = await supabase
          .from("profiles")
          .select("wallet_balance")
          .eq("id", data.user.id)
          .maybeSingle();
        if (prof) setWalletBalance(Number(prof.wallet_balance ?? 0));

        // Fetch notifications
        try {
          const { data: notifs } = await supabase
            .from("notifications")
            .select("id, type, title, message, link, is_read, created_at")
            .eq("user_id", data.user.id)
            .order("created_at", { ascending: false })
            .limit(6);
          setNotifications(notifs ?? []);
        } catch {
          // ignore
        }
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setEmail(s?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const unreadNotifs = notifications.filter((n) => !n.is_read).length;

  const navLinks: { to: string; label: string; search?: Record<string, string> }[] = [
    { to: "/", label: lang === "sw" ? "Mwanzo" : "Home" },
    { to: "/browse", label: lang === "sw" ? "Tazama Bidhaa" : "Browse" },
    { to: "/donations", label: lang === "sw" ? "Michango" : "Donation Hub" },
    { to: "/safety", label: t("safetyTips") },
    ...(email ? [{ to: "/dashboard", label: t("myDashboard") }] : []),
    ...(isAdmin ? [{ to: "/admin", label: t("adminPanel") }] : []),
  ];

  return (
    <header className="bg-primary text-white sticky top-0 z-40 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5">
        <Logo light />

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-white/90">
          {navLinks.map((n, i) => (
            <Link key={`${n.to}-${i}`} to={n.to} search={n.search as never} className="hover:text-white transition-colors">
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-2.5">
          {email && (
            <Link
              to="/dashboard"
              title="Your wallet credit balance"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold transition"
            >
              <Wallet className="h-3.5 w-3.5 text-emerald-300" />
              <span>KSh {walletBalance.toLocaleString()}</span>
            </Link>
          )}

          {email && (
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Notifications"
                className="relative grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 transition"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white">
                    {unreadNotifs}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-card text-foreground shadow-2xl border border-border/70 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2 px-1">
                    <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Notifications</span>
                    <span className="text-[10px] text-muted-foreground">{unreadNotifs} unread</span>
                  </div>
                  <div className="divide-y divide-border/40 max-h-64 overflow-y-auto mt-1">
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-xs text-muted-foreground">No new notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="py-2.5 px-1 hover:bg-muted/40 rounded-lg transition text-xs">
                          <div className="font-semibold text-foreground flex items-center justify-between">
                            <span>{n.title}</span>
                            {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                          </div>
                          <p className="text-muted-foreground text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-border/50 pt-2 text-center">
                    <Link
                      to="/dashboard"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View All in Dashboard
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Favorites link */}
          {email && (
            <Link
              to="/dashboard"
              title="Your Saved Favorites"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <Heart className="h-4 w-4 text-rose-300" />
            </Link>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(lang === "en" ? "sw" : "en")}
            title="Switch Language / Badili Lugha"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold transition cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5 text-white/80" />
            <span className="uppercase">{lang}</span>
          </button>

          {/* Market Inquiry */}
          <Link
            to="/market"
            title="Ask the market or explore what's already listed"
            className="inline-flex items-center gap-1.5 rounded-full bg-white text-primary px-4 py-2 text-sm font-semibold shadow-sm hover:shadow-md transition"
          >
            <MessagesSquare className="h-3.5 w-3.5" /> Market Inquiry
          </Link>

          {email ? (
            <button
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <Link
              to="/auth"
              aria-label="Sign in"
              title="Sign in"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <User className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 transition"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-primary-dark px-5 py-4 space-y-1 animate-in slide-in-from-top duration-200">
          {navLinks.map((n, i) => (
            <Link
              key={`${n.to}-${i}`}
              to={n.to}
              search={n.search as never}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition"
            >
              {n.label === "Donation Hub" && <HeartHandshake className="h-4 w-4" />}
              {n.label === "Safety Tips" && <ShieldCheck className="h-4 w-4" />}
              {n.to === "/" && n.label === "Home" && <span>🏠</span>}
              {n.to === "/browse" && n.label === "Browse" && <span>🔍</span>}
              {n.to === "/dashboard" && <LayoutDashboard className="h-4 w-4" />}
              {n.to === "/admin" && <ShieldAlert className="h-4 w-4" />}
              {n.label}
            </Link>
          ))}
          <div className="border-t border-white/10 pt-3 mt-3 space-y-2">
            <Link
              to="/market"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-white text-primary py-2.5 text-sm font-bold"
            >
              <MessagesSquare className="h-4 w-4" /> Market Inquiry
            </Link>

            {email ? (
              <button
                onClick={() => { signOut(); setMobileOpen(false); }}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-white/10 text-white py-2.5 text-sm font-semibold"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-white/10 text-white py-2.5 text-sm font-semibold"
              >
                <User className="h-4 w-4" /> Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="relative bg-primary-dark text-white mt-16">
      <div aria-hidden className="absolute inset-y-0 left-0 w-16 kente-pattern opacity-90" />
      <div aria-hidden className="absolute inset-y-0 right-0 w-16 kente-pattern opacity-90" />
      <div className="mx-auto max-w-7xl px-6 md:px-24 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <Logo light />
          <p className="mt-4 text-sm text-white/75 max-w-xs">
            Your trusted platform for buying and selling locally across Kenya — safely &amp; honestly.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/sell" className="hover:text-white transition-colors">Sell an Item</Link></li>
            <li><Link to="/browse" className="hover:text-white transition-colors">Browse Listings</Link></li>
            <li><Link to="/safety" className="hover:text-white transition-colors">Safety Tips &amp; Buyer Guide</Link></li>
            <li><Link to="/auth" className="hover:text-white transition-colors">Sign In / Register</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Follow Us</h4>
          <div className="flex gap-3">
            {[MessageCircle, Facebook, Instagram, Music2].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20 transition"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <p className="mt-4 text-xs text-white/50">M-Pesa Paybill: 247247</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/70">
        © {new Date().getFullYear()} Sokonyumbani. All rights reserved. · Built for Kenya 🇰🇪
      </div>
    </footer>
  );
}

export function useCurrentRoute() {
  return useRouterState({ select: (s) => s.location.pathname });
}