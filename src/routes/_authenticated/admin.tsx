import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminStats,
  updateListingStatus,
  getAdminReports,
  adminResolveReport,
  getPendingVerifications,
  adminApproveVerification,
  getAdminDisputes,
  adminResolveDispute,
} from "@/lib/marketplace.functions";
import { Header, Footer } from "@/components/site-chrome";
import { toast } from "sonner";
import {
  Users,
  Package,
  HandCoins,
  TrendingUp,
  CheckCircle2,
  Trash2,
  PackageCheck,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  BarChart3,
  Flag,
  BadgeCheck,
  XCircle,
  FileText,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Sokonyumbani" },
      { name: "description", content: "Sokonyumbani site-wide admin control panel." },
    ],
  }),
});

type Stats = Awaited<ReturnType<typeof adminStats>>;

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  tone: string;
  sub?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border/40 shadow-sm p-3.5 flex flex-col gap-2">
      <div className={`inline-flex h-9 w-9 rounded-lg items-center justify-center ${tone}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <div className="text-lg font-extrabold tracking-tight">{value}</div>
        <div className="text-[10px] font-semibold text-muted-foreground mt-0.5">{label}</div>
        {sub && <div className="text-[9px] text-muted-foreground/70 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-orange-50 text-orange-700 border-orange-200",
    sold: "bg-amber-50 text-amber-700 border-amber-200",
    deleted: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status === "active" && <CheckCircle2 className="h-3 w-3" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function AdminPage() {
  const fetchStats = useServerFn(adminStats);
  const markStatus = useServerFn(updateListingStatus);
  const fetchReports = useServerFn(getAdminReports);
  const resolveReport = useServerFn(adminResolveReport);
  const fetchVerifications = useServerFn(getPendingVerifications);
  const approveVerification = useServerFn(adminApproveVerification);
  const fetchDisputes = useServerFn(getAdminDisputes);
  const resolveDispute = useServerFn(adminResolveDispute);

  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"listings" | "users" | "reports" | "verifications" | "disputes">("listings");
  const [reports, setReports] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = async () => {
    setRefreshing(true);
    try {
      const data = await fetchStats();
      setS(data);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Access denied");
    } finally {
      setRefreshing(false);
    }
  };

  const loadReports = async () => {
    try {
      const data = await fetchReports();
      setReports(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load reports");
    }
  };

  const loadVerifications = async () => {
    try {
      const data = await fetchVerifications();
      setVerifications(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load verifications");
    }
  };

  const loadDisputes = async () => {
    try {
      const data = await fetchDisputes();
      setDisputes(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load disputes");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "reports") loadReports();
    if (activeTab === "verifications") loadVerifications();
    if (activeTab === "disputes") loadDisputes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleStatusChange = async (listingId: string, status: "sold" | "deleted") => {
    try {
      await markStatus({ data: { listing_id: listingId, status } });
      toast.success(`Listing marked as ${status}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const handleResolveReport = async (report_id: string, action: "dismiss" | "delete_listing" | "resolve") => {
    setProcessingId(report_id);
    try {
      await resolveReport({ data: { report_id, action } });
      toast.success(action === "dismiss" ? "Report dismissed" : action === "delete_listing" ? "Listing deleted & report resolved" : "Report resolved");
      await loadReports();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleVerification = async (user_id: string, status: "approved" | "rejected") => {
    setProcessingId(user_id);
    try {
      await approveVerification({ data: { user_id, status } });
      toast.success(status === "approved" ? "Seller verified ✓" : "Verification rejected");
      await loadVerifications();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolveDispute = async (dispute_id: string, action: "refund_buyer" | "release_seller") => {
    setProcessingId(dispute_id);
    try {
      await resolveDispute({ data: { dispute_id, action } });
      toast.success(action === "refund_buyer" ? "Dispute resolved: Buyer refunded" : "Dispute resolved: Funds released to seller");
      await loadDisputes();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to resolve dispute");
    } finally {
      setProcessingId(null);
    }
  };

  if (err)
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 grid place-items-center px-4 py-20">
          <div className="max-w-md text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/10 mb-4">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-destructive mb-2">Access Denied</h2>
            <p className="text-muted-foreground text-sm">{err}</p>
            <Link to="/" className="mt-6 inline-flex rounded-xl bg-primary text-white px-5 py-2.5 text-sm font-bold">
              Return Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );

  if (!s)
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 grid place-items-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Loading admin data…</p>
          </div>
        </main>
        <Footer />
      </div>
    );

  const cards = [
    { icon: Users, label: "Total Users", value: s.users, tone: "bg-blue-50 text-blue-700", sub: "Registered accounts" },
    { icon: Package, label: "Total Listings", value: s.listings, tone: "bg-primary/10 text-primary-dark", sub: "All time" },
    { icon: HandCoins, label: "Total Offers", value: s.offers, tone: "bg-amber-50 text-amber-700", sub: "Buyer proposals" },
    { icon: TrendingUp, label: "Revenue (KSh)", value: Number(s.revenue).toLocaleString(), tone: "bg-orange-50 text-orange-700", sub: "Ad fees collected" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-4">
        <div className="mx-auto max-w-7xl px-4">
          {/* Page header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Admin Control Panel</span>
              </div>
              <h1 className="text-xl font-extrabold text-primary-dark tracking-tight">Site Dashboard</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time activity across all of Sokonyumbani Kenya.</p>
            </div>
            <button
              onClick={load}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary-dark border border-primary/20 px-3 py-1.5 text-xs font-semibold hover:bg-primary/20 transition disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {cards.map((c) => (
              <StatCard key={c.label} {...c} />
            ))}
          </div>

          {/* Revenue bar viz */}
          <div className="bg-card rounded-xl border border-border/40 shadow-sm p-3.5 mb-4">
            <div className="flex items-center gap-1.5 mb-3">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <h2 className="font-bold text-xs">Revenue at a Glance</h2>
            </div>
            <div className="flex items-end gap-1 h-16">
              {[
                { label: "Users", val: s.users, color: "bg-blue-400" },
                { label: "Listings", val: s.listings, color: "bg-primary" },
                { label: "Offers", val: s.offers, color: "bg-amber-400" },
                { label: "Revenue ÷100", val: Math.round(s.revenue / 100), color: "bg-orange-400" },
              ].map((bar) => {
                const max = Math.max(s.users, s.listings, s.offers, Math.round(s.revenue / 100), 1);
                const pct = Math.max(8, Math.round((bar.val / max) * 100));
                return (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-muted-foreground">{bar.val}</span>
                    <div className="w-full rounded-t-md" style={{ height: `${pct}%` }}>
                      <div className={`w-full h-full rounded-t-md ${bar.color}`} />
                    </div>
                    <span className="text-[8px] text-muted-foreground text-center">{bar.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabs: Listings | Users | Reports | Verifications */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg mb-3 flex-wrap">
            <button
              onClick={() => setActiveTab("listings")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${activeTab === "listings" ? "bg-white shadow text-primary-dark" : "text-muted-foreground hover:text-foreground"}`}
            >
              Recent Listings
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${activeTab === "users" ? "bg-white shadow text-primary-dark" : "text-muted-foreground hover:text-foreground"}`}
            >
              Recent Users
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1 ${activeTab === "reports" ? "bg-white shadow text-primary-dark" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Flag className="h-3 w-3" /> Reports
            </button>
            <button
              onClick={() => setActiveTab("verifications")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1 ${activeTab === "verifications" ? "bg-white shadow text-primary-dark" : "text-muted-foreground hover:text-foreground"}`}
            >
              <BadgeCheck className="h-3 w-3" /> Verifications
            </button>
            <button
              onClick={() => setActiveTab("disputes")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1 ${activeTab === "disputes" ? "bg-white shadow text-primary-dark" : "text-muted-foreground hover:text-foreground"}`}
            >
              <AlertTriangle className="h-3 w-3 text-amber-500" /> Disputes
            </button>
          </div>

          {/* Listings table */}
          {activeTab === "listings" && (
            <div className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border/40">
                <h2 className="font-bold text-sm flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-primary" /> Recent Listings (last 10)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-2">Title</th>
                      <th className="px-4 py-2">Price</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {s.recentListings.map((l) => (
                      <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-medium max-w-[180px] truncate">
                          <Link
                            to="/listing/$id"
                            params={{ id: l.id }}
                            className="hover:text-primary hover:underline flex items-center gap-1"
                          >
                            {l.title}
                            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-primary-dark font-bold">
                          KSh {Number(l.price).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={l.status} />
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground text-[10px]">
                          {new Date(l.created_at).toLocaleDateString("en-KE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            {l.status !== "sold" && (
                              <button
                                onClick={() => handleStatusChange(l.id, "sold")}
                                title="Mark as sold"
                                className="grid h-7 w-7 place-items-center rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 transition cursor-pointer"
                              >
                                <PackageCheck className="h-3 w-3" />
                              </button>
                            )}
                            {l.status !== "deleted" && (
                              <button
                                onClick={() => handleStatusChange(l.id, "deleted")}
                                title="Delete listing"
                                className="grid h-7 w-7 place-items-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {s.recentListings.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-xs">
                          No listings yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users table */}
          {activeTab === "users" && (
            <div className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border/40">
                <h2 className="font-bold text-sm flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" /> Recent Users (last 10)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Phone</th>
                      <th className="px-4 py-2">Joined</th>
                      <th className="px-4 py-2">Store</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {s.recentUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-semibold">{u.full_name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-2.5 w-2.5 shrink-0" /> {u.email}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5 shrink-0" /> {u.phone || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground text-[10px]">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5 shrink-0" />
                            {new Date(u.created_at).toLocaleDateString("en-KE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <Link
                            to="/store/$userId"
                            params={{ userId: u.id }}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                          >
                            View Store <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {s.recentUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-xs">
                          No users yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports & Moderation tab */}
          {activeTab === "reports" && (
            <div className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border/40 flex items-center justify-between">
                <h2 className="font-bold text-sm flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5 text-red-500" /> Reports & Moderation
                </h2>
                <button onClick={loadReports} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
              </div>
              {reports.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                  No pending reports.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {reports.map((r: any) => (
                    <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            r.status === "pending" ? "bg-red-50 text-red-600 border-red-200" :
                            r.status === "resolved" ? "bg-green-50 text-green-700 border-green-200" :
                            "bg-muted text-muted-foreground border-border"
                          }`}>
                            {r.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div className="text-xs font-semibold mb-0.5">Reason: <span className="font-normal">{r.reason}</span></div>
                        {r.details && <div className="text-[11px] text-muted-foreground italic truncate max-w-md">"{r.details}"</div>}
                        {r.listing_id && (
                          <Link to="/listing/$id" params={{ id: r.listing_id }} className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1">
                            <ExternalLink className="h-2.5 w-2.5" /> View Listing
                          </Link>
                        )}
                      </div>
                      {r.status === "pending" && (
                        <div className="flex gap-2 shrink-0 flex-wrap">
                          <button
                            disabled={processingId === r.id}
                            onClick={() => handleResolveReport(r.id, "dismiss")}
                            className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition disabled:opacity-50 cursor-pointer"
                          >
                            Dismiss
                          </button>
                          <button
                            disabled={processingId === r.id}
                            onClick={() => handleResolveReport(r.id, "resolve")}
                            className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition disabled:opacity-50 cursor-pointer"
                          >
                            Resolve
                          </button>
                          {r.listing_id && (
                            <button
                              disabled={processingId === r.id}
                              onClick={() => handleResolveReport(r.id, "delete_listing")}
                              className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-100 transition disabled:opacity-50 cursor-pointer"
                            >
                              Delete Listing
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Seller Verifications tab */}
          {activeTab === "verifications" && (
            <div className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border/40 flex items-center justify-between">
                <h2 className="font-bold text-sm flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5 text-green-600" /> Pending Seller Verifications
                </h2>
                <button onClick={loadVerifications} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
              </div>
              {verifications.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  <BadgeCheck className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                  No pending verifications.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {verifications.map((v: any) => (
                    <div key={v.id} className="p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-bold">{v.full_name || "Unknown"}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Mail className="h-2.5 w-2.5" /> {v.email}
                          </span>
                          {v.phone && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5" /> {v.phone}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 flex-wrap text-[10px] text-muted-foreground">
                          {v.kra_pin && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-2.5 w-2.5" /> KRA PIN: <span className="font-mono font-bold text-foreground">{v.kra_pin}</span>
                            </span>
                          )}
                          {v.id_document_url && (
                            <a href={v.id_document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                              <ExternalLink className="h-2.5 w-2.5" /> View ID Document
                            </a>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          Submitted {new Date(v.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          disabled={processingId === v.id}
                          onClick={() => handleVerification(v.id, "approved")}
                          className="px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold hover:bg-green-100 transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                        >
                          <BadgeCheck className="h-3 w-3" /> Approve
                        </button>
                        <button
                          disabled={processingId === v.id}
                          onClick={() => handleVerification(v.id, "rejected")}
                          className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-100 transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Disputes Tab */}
          {activeTab === "disputes" && (
            <div className="bg-card rounded-xl border border-border/40 shadow-sm p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h2 className="font-bold text-sm">Escrow Disputes ({disputes.filter((d: any) => d.status === "opened").length} open)</h2>
              </div>
              {disputes.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground">No escrow disputes filed.</div>
              ) : (
                <div className="divide-y divide-border/30">
                  {disputes.map((d: any) => (
                    <div key={d.id} className="py-3 flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold font-mono">Dispute #{d.id.slice(0, 8)}</span>
                          <span className="text-[10px] text-muted-foreground">Order #{d.order_id?.slice(0, 8)}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            d.status === "opened" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200"
                          }`}>{d.status}</span>
                        </div>
                        <p className="text-xs text-foreground font-medium mb-1">{d.reason}</p>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          Opened {new Date(d.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                      {d.status === "opened" && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            disabled={processingId === d.id}
                            onClick={() => handleResolveDispute(d.id, "refund_buyer")}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition disabled:opacity-50 cursor-pointer"
                          >
                            Refund Buyer
                          </button>
                          <button
                            disabled={processingId === d.id}
                            onClick={() => handleResolveDispute(d.id, "release_seller")}
                            className="px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold hover:bg-green-100 transition disabled:opacity-50 cursor-pointer"
                          >
                            Release to Seller
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
