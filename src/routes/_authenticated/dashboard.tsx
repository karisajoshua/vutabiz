import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  respondOffer,
  updateListingStatus,
  getMyConversations,
  getConversationMessages,
  sendMessage,
  submitSellerVerification,
  verifyPhoneOtp,
  getMySavedSearches,
  deleteSavedSearch,
  topupWallet,
  boostListing,
  bulkImportListings,
  getMyOrders,
  confirmDeliveryAndReleaseEscrow,
  openOrderDispute,
  updateOrderDeliveryStatus,
  getMyFavorites,
  toggleFavorite,
  getMyReferralInfo,
  getSellerAnalytics,
  renewListing,
} from "@/lib/marketplace.functions";
import { Header, Footer } from "@/components/site-chrome";
import { toast } from "sonner";
import {
  Check,
  X,
  Trash2,
  PackageCheck,
  Plus,
  Store,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  HandCoins,
  MessageCircle,
  Wallet,
  ShieldCheck,
  Bookmark,
  FileSpreadsheet,
  Sparkles,
  Flame,
  Send,
  UploadCloud,
  ArrowRight,
  RefreshCw,
  Truck,
  Heart,
  Share2,
  BarChart3,
  Users,
  AlertTriangle,
  RotateCw,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

type Listing = {
  id: string;
  title: string;
  price: number;
  status: string;
  ad_paid: boolean;
  ad_fee_ksh: number;
  image_url: string | null;
  promotion_tier?: string | null;
  views_count?: number | null;
};
type Offer = {
  id: string;
  amount: number;
  message: string | null;
  status: string;
  listing_id: string;
  buyer_id: string;
  created_at: string;
};
type Profile = {
  full_name: string;
  email: string;
  phone: string;
  town: string | null;
  county_id: number | null;
  is_phone_verified?: boolean | null;
  verification_status?: string | null;
  wallet_balance?: number | null;
  subscription_tier?: string | null;
};

function OfferStatusBadge({ status }: { status: string }) {
  if (status === "accepted")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="h-3 w-3" /> Accepted
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
        <XCircle className="h-3 w-3" /> Rejected
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}

function Dashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [buyers, setBuyers] = useState<Record<string, { full_name: string; phone: string }>>({});
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "listings" | "offers" | "inbox" | "orders" | "analytics" | "favorites" | "referrals" | "wallet" | "verification" | "saved" | "bulk"
  >("listings");

  const respond = useServerFn(respondOffer);
  const setStatus = useServerFn(updateListingStatus);
  const doSubmitVerification = useServerFn(submitSellerVerification);
  const doVerifyOtp = useServerFn(verifyPhoneOtp);
  const doGetConversations = useServerFn(getMyConversations);
  const doGetMessages = useServerFn(getConversationMessages);
  const doSendMessage = useServerFn(sendMessage);
  const doGetSavedSearches = useServerFn(getMySavedSearches);
  const doDeleteSavedSearch = useServerFn(deleteSavedSearch);
  const doTopup = useServerFn(topupWallet);
  const doBoost = useServerFn(boostListing);
  const doBulkImport = useServerFn(bulkImportListings);

  // New feature hooks
  const doGetOrders = useServerFn(getMyOrders);
  const doConfirmDelivery = useServerFn(confirmDeliveryAndReleaseEscrow);
  const doOpenDispute = useServerFn(openOrderDispute);
  const doUpdateDelivery = useServerFn(updateOrderDeliveryStatus);
  const doGetFavorites = useServerFn(getMyFavorites);
  const doToggleFav = useServerFn(toggleFavorite);
  const doGetReferrals = useServerFn(getMyReferralInfo);
  const doGetAnalytics = useServerFn(getSellerAnalytics);
  const doRenewListing = useServerFn(renewListing);

  // Feature states
  const [orders, setOrders] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [referralInfo, setReferralInfo] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [disputeModalOrder, setDisputeModalOrder] = useState<any | null>(null);
  const [disputeReason, setDisputeReason] = useState("item_not_received");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  // New tab states
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [topupAmount, setTopupAmount] = useState(500);
  const [topupPhone, setTopupPhone] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);
  const [idDocUrl, setIdDocUrl] = useState("");
  const [kraPin, setKraPin] = useState("");
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [phoneToVerify, setPhoneToVerify] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [importingCsv, setImportingCsv] = useState(false);

  // Boost modal state
  const [boostModalListing, setBoostModalListing] = useState<Listing | null>(null);
  const [boostTier, setBoostTier] = useState<"boosted" | "urgent" | "featured">("boosted");
  const [boosting, setBoosting] = useState(false);

  const load = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setUserId(u.user.id);

    const [{ data: mine }, { data: prof }] = await Promise.all([
      supabase
        .from("listings")
        .select("id,title,price,status,ad_paid,ad_fee_ksh,image_url,promotion_tier,views_count")
        .eq("seller_id", u.user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("full_name,email,phone,town,county_id,is_phone_verified,verification_status,wallet_balance,subscription_tier")
        .eq("id", u.user.id)
        .maybeSingle(),
    ]);

    setListings((mine as Listing[]) ?? []);
    setProfile(prof as Profile | null);
    if (prof?.phone) setPhoneToVerify(prof.phone);

    const ids = (mine ?? []).map((m) => m.id);
    if (ids.length) {
      const { data: offs } = await supabase
        .from("offers")
        .select("id,amount,message,status,listing_id,buyer_id,created_at")
        .in("listing_id", ids)
        .order("created_at", { ascending: false });
      setOffers((offs as Offer[]) ?? []);

      const buyerIds = Array.from(new Set((offs ?? []).map((o) => o.buyer_id)));
      if (buyerIds.length) {
        const { data: bs } = await supabase
          .from("profiles")
          .select("id,full_name,phone")
          .in("id", buyerIds);
        const map: Record<string, { full_name: string; phone: string }> = {};
        (bs ?? []).forEach((b) => (map[b.id] = { full_name: b.full_name as string, phone: b.phone as string }));
        setBuyers(map);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Load tab-specific data
  useEffect(() => {
    if (activeTab === "inbox") {
      doGetConversations().then(setConversations).catch(console.error);
    } else if (activeTab === "saved") {
      doGetSavedSearches().then(setSavedSearches).catch(console.error);
    } else if (activeTab === "orders") {
      doGetOrders().then(setOrders).catch(console.error);
    } else if (activeTab === "favorites") {
      doGetFavorites().then(setFavorites).catch(console.error);
    } else if (activeTab === "referrals") {
      doGetReferrals().then(setReferralInfo).catch(console.error);
    } else if (activeTab === "analytics") {
      doGetAnalytics().then(setAnalyticsData).catch(console.error);
    }
  }, [activeTab]);

  // Load messages for selected conversation
  useEffect(() => {
    if (selectedConv) {
      doGetMessages({ data: { conversation_id: selectedConv.id } }).then(setMessages).catch(console.error);
    }
  }, [selectedConv]);

  async function handleSendMessage() {
    if (!chatText.trim() || !selectedConv) return;
    try {
      await doSendMessage({ data: { conversation_id: selectedConv.id, content: chatText.trim() } });
      setChatText("");
      const msgs = await doGetMessages({ data: { conversation_id: selectedConv.id } });
      setMessages(msgs);
    } catch (err: any) {
      toast.error(err.message || "Failed to send message.");
    }
  }

  async function handleTopupWallet() {
    if (!topupAmount || topupAmount <= 0) return;
    setTopupLoading(true);
    try {
      await doTopup({ data: { amount: topupAmount } });
      toast.success(`KSh ${topupAmount.toLocaleString()} added to your wallet!`);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Top-up failed.");
    } finally {
      setTopupLoading(false);
    }
  }

  async function handleBoostListing() {
    if (!boostModalListing) return;
    setBoosting(true);
    try {
      await doBoost({ data: { listing_id: boostModalListing.id, tier: boostTier, payment_method: "wallet" } });
      toast.success(`Listing boosted to ${boostTier.toUpperCase()}!`);
      setBoostModalListing(null);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Boost failed.");
    } finally {
      setBoosting(false);
    }
  }

  async function handleVerifyPhoneOtp() {
    if (!otpCode) return;
    try {
      await doVerifyOtp({ data: { phone: phoneToVerify, otp: otpCode } });
      toast.success("Phone verified successfully!");
      setVerifyingPhone(false);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP code.");
    }
  }

  async function handleSubmitIdVerification(e: React.FormEvent) {
    e.preventDefault();
    if (!idDocUrl) {
      toast.error("Please provide your ID document link/image.");
      return;
    }
    try {
      await doSubmitVerification({ data: { id_document_url: idDocUrl, kra_pin: kraPin || undefined } });
      toast.success("Verification submitted! Pending admin review.");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Submission failed.");
    }
  }

  async function handleBulkImport() {
    if (!csvContent.trim()) return;
    setImportingCsv(true);
    try {
      const lines = csvContent.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(",").map((v) => v.trim());
        const row: Record<string, any> = {};
        headers.forEach((h, idx) => {
          row[h] = vals[idx] || "";
        });
        return {
          title: row.title || "Bulk Item",
          description: row.description || undefined,
          price: Number(row.price || 0),
          contact_phone: row.phone || undefined,
        };
      });

      const res = await doBulkImport({ data: { items: rows } });
      toast.success(`Imported ${res.count} listings!`);
      setCsvContent("");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Bulk import failed.");
    } finally {
      setImportingCsv(false);
    }
  }

  async function act(id: string, action: "accepted" | "rejected") {
    try {
      await respond({ data: { offer_id: id, action } });
      toast.success(`Offer ${action}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function change(id: string, status: "sold" | "deleted") {
    try {
      await setStatus({ data: { listing_id: id, status } });
      toast.success("Listing updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  const activeListings = listings.filter((l) => l.status === "active").length;
  const pendingOffers = offers.filter((o) => o.status === "pending").length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-4">
        <div className="mx-auto max-w-6xl px-4">

          {/* Top bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl font-extrabold text-primary-dark tracking-tight">
                My Dashboard
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Welcome back, {profile?.full_name ?? "Seller"} 👋
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link
                to="/store/$userId"
                params={{ userId }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-primary text-primary px-3 py-1.8 text-xs font-semibold hover:bg-primary/5 transition"
              >
                <Store className="h-3.5 w-3.5" /> My Store
              </Link>
              <Link
                to="/sell"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-dark text-white px-3 py-1.8 text-xs font-semibold hover:bg-primary transition shadow"
              >
                <Plus className="h-3.5 w-3.5" /> New Listing
              </Link>
            </div>
          </div>

          {/* Profile + Stats strip */}
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-3 mb-4">
            {/* Profile card */}
            {profile && (
              <div className="bg-card border border-border/40 rounded-xl shadow-sm p-3.5 flex items-center gap-3 md:min-w-[240px]">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary shrink-0">
                  <User className="h-5.5 w-5.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{profile.full_name}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" /> {profile.phone || "—"}
                  </div>
                  {profile.town && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {profile.town}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mini stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: Package, label: "Total Listings", value: listings.length, color: "bg-primary/10 text-primary" },
                { icon: CheckCircle2, label: "Active Listings", value: activeListings, color: "bg-orange-50 text-orange-700" },
                { icon: HandCoins, label: "Pending Offers", value: pendingOffers, color: "bg-amber-50 text-amber-700" },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border/40 rounded-xl shadow-sm p-3 flex items-center gap-2.5">
                  <div className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${s.color}`}>
                    <s.icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-lg font-extrabold">{s.value}</div>
                    <div className="text-[10px] text-muted-foreground">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted p-1 rounded-xl mb-4.5 overflow-x-auto">
            {[
              { id: "listings", label: "My Listings", count: listings.length, icon: Package },
              { id: "offers", label: "Offers", count: pendingOffers, icon: HandCoins },
              { id: "inbox", label: "Inbox / Chat", count: conversations.filter(c => c.unread_count > 0).length, icon: MessageCircle },
              { id: "wallet", label: "Wallet", count: null, icon: Wallet },
              { id: "verification", label: "Verification", count: null, icon: ShieldCheck },
              { id: "saved", label: "Saved Searches", count: savedSearches.length, icon: Bookmark },
              { id: "bulk", label: "Bulk CSV", count: null, icon: FileSpreadsheet },
              { id: "orders", label: "Orders & Escrow", count: null, icon: Truck },
              { id: "analytics", label: "Analytics", count: null, icon: BarChart3 },
              { id: "favorites", label: "Favorites", count: null, icon: Heart },
              { id: "referrals", label: "Refer & Earn", count: null, icon: Users },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeTab === t.id
                      ? "bg-white shadow text-primary-dark font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                  {t.count !== null && t.count > 0 && (
                    <span className="text-[10px] bg-primary text-white rounded-full px-1.5 py-0.2">
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Listings tab */}
          {activeTab === "listings" && (
            <div className="space-y-2">
              {listings.map((l) => (
                <div
                  key={l.id}
                  className="bg-card rounded-xl border border-border/40 shadow-sm p-2.5 flex items-center gap-3"
                >
                  <div className="h-12 w-12 bg-muted rounded-lg overflow-hidden shrink-0">
                    {l.image_url ? (
                       <img src={l.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-muted-foreground text-[10px]">No img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        to="/listing/$id"
                        params={{ id: l.id }}
                        className="font-bold text-xs truncate hover:text-primary transition-colors"
                      >
                        {l.title}
                      </Link>
                      {l.promotion_tier === "featured" && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500 text-white">FEATURED</span>
                      )}
                      {l.promotion_tier === "urgent" && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-rose-600 text-white">URGENT</span>
                      )}
                      {l.promotion_tier === "boosted" && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-primary text-white">BOOSTED</span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      KSh {Number(l.price).toLocaleString()}
                      <span className="mx-1 text-border">·</span>
                      Ad: KSh {l.ad_fee_ksh}
                      <span className="mx-1 text-border">·</span>
                      <span className={l.ad_paid ? "text-orange-600 font-semibold" : "text-amber-600 font-semibold"}>
                        {l.ad_paid ? "✓ Paid" : "Unpaid"}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      l.status === "active"
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : l.status === "sold"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {l.status}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    {l.status === "active" && (
                      <button
                        onClick={() => setBoostModalListing(l)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition cursor-pointer"
                        title="Boost this listing"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Boost
                      </button>
                    )}
                    {l.status !== "sold" && (
                      <button
                        onClick={() => change(l.id, "sold")}
                        title="Mark as sold"
                        className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition cursor-pointer"
                      >
                        <PackageCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {l.status !== "deleted" && (
                      <button
                        onClick={() => change(l.id, "deleted")}
                        title="Delete listing"
                        className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!listings.length && (
                <div className="text-center py-10 bg-card rounded-xl border border-border/40">
                  <p className="text-muted-foreground text-xs">No listings yet.</p>
                  <Link
                    to="/sell"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary text-white px-4 py-2 text-xs font-bold shadow hover:bg-primary-dark transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Post your first ad
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Offers tab — grouped per listing so the seller can compare and pick one */}
          {activeTab === "offers" && (
            <div className="space-y-4">
              {listings
                .map((l) => ({ listing: l, list: offers.filter((o) => o.listing_id === l.id) }))
                .filter((g) => g.list.length > 0)
                .map(({ listing, list }) => {
                  const sorted = [...list].sort((a, b) => Number(b.amount) - Number(a.amount));
                  const best = sorted.find((o) => o.status === "pending")?.id;
                  const hasAccepted = list.some((o) => o.status === "accepted");
                  return (
                    <div
                      key={listing.id}
                      className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden"
                    >
                      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-muted/40 border-b border-border/40">
                        <div className="h-9 w-9 rounded-lg bg-muted overflow-hidden shrink-0">
                          {listing.image_url && (
                            <img src={listing.image_url} alt={listing.title} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold truncate">{listing.title}</div>
                          <div className="text-[10px] text-muted-foreground">
                            Asking KSh {Number(listing.price).toLocaleString()} · {list.length} offer
                            {list.length > 1 ? "s" : ""}
                          </div>
                        </div>
                        {hasAccepted && (
                          <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                            Offer accepted
                          </span>
                        )}
                      </div>
                      <div className="divide-y divide-border/40">
                        {sorted.map((o) => {
                          const buyer = buyers[o.buyer_id];
                          return (
                            <div key={o.id} className="p-2.5 flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold flex items-center gap-1.5 flex-wrap">
                                  <span className="text-foreground">{buyer?.full_name ?? "Buyer"}</span> offered{" "}
                                  <span className="text-primary-dark font-extrabold">
                                    KSh {Number(o.amount).toLocaleString()}
                                  </span>
                                  {o.id === best && !hasAccepted && (
                                    <span className="text-[9px] font-bold uppercase tracking-wide bg-primary/10 text-primary-dark border border-primary/20 rounded-full px-1.5 py-0.5">
                                      Highest
                                    </span>
                                  )}
                                </div>
                                {o.message && (
                                  <div className="text-[11px] text-muted-foreground italic mt-0.5 truncate">
                                    "{o.message}"
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {buyer?.phone && (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <Phone className="h-2.5 w-2.5" /> {buyer.phone}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(o.created_at).toLocaleDateString("en-KE", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </span>
                                </div>
                              </div>
                              <OfferStatusBadge status={o.status} />
                              {o.status === "pending" && (
                                <div className="flex gap-1 shrink-0">
                                  <button
                                    onClick={() => act(o.id, "accepted")}
                                    title="Accept this offer"
                                    className="grid h-8 w-8 place-items-center rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition cursor-pointer"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => act(o.id, "rejected")}
                                    title="Reject offer"
                                    className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition cursor-pointer"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="px-3 py-1.5 bg-muted/20 text-[10px] text-muted-foreground">
                        Accepting one offer automatically declines the rest and unlocks your contact for that buyer.{" "}
                        <Link to="/listing/$id" params={{ id: listing.id }} className="text-primary hover:underline font-bold">
                          View listing
                        </Link>
                      </div>
                    </div>
                  );
                })}
              {!offers.length && (
                <div className="text-center py-10 bg-card rounded-xl border border-border/40">
                  <p className="text-muted-foreground text-xs">No offers received yet.</p>
                </div>
              )}
            </div>
          )}
          {/* Inbox / Chat Tab */}
          {activeTab === "inbox" && (
            <div className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden grid md:grid-cols-[300px_1fr] min-h-[480px]">
              <div className="border-r border-border/40 divide-y divide-border/40 max-h-[550px] overflow-y-auto">
                <div className="p-3 font-bold text-xs bg-muted/30">Conversations</div>
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConv(c)}
                    className={`w-full text-left p-3 flex items-start gap-2.5 transition cursor-pointer ${
                      selectedConv?.id === c.id ? "bg-primary/10" : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/20 text-primary grid place-items-center font-bold text-xs shrink-0">
                      {(c.other_party?.full_name || "U")[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">{c.other_party?.full_name || "User"}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{c.listing?.title || "Listing"}</div>
                      <div className="text-[10px] text-foreground/80 truncate mt-0.5">{c.last_message || "No messages"}</div>
                    </div>
                  </button>
                ))}
                {!conversations.length && (
                  <div className="p-6 text-center text-xs text-muted-foreground">No conversations yet.</div>
                )}
              </div>
              <div className="flex flex-col h-[550px]">
                {selectedConv ? (
                  <>
                    <div className="p-3 border-b border-border/40 bg-muted/20 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs">{selectedConv.other_party?.full_name}</div>
                        <div className="text-[10px] text-muted-foreground">Re: {selectedConv.listing?.title}</div>
                      </div>
                      <Link to="/listing/$id" params={{ id: selectedConv.listing?.id }} className="text-[11px] text-primary underline">
                        View item
                      </Link>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
                      {messages.map((m) => {
                        const isMe = m.sender_id === userId;
                        return (
                          <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs ${
                              isMe ? "bg-primary text-white" : "bg-muted text-foreground"
                            }`}>
                              <div>{m.content}</div>
                              <div className={`text-[8px] mt-0.5 ${isMe ? "text-white/70" : "text-muted-foreground"}`}>
                                {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="p-2.5 border-t border-border/40 flex gap-2">
                      <input
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                        placeholder="Type your message..."
                        className="flex-1 rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="rounded-lg bg-primary text-white px-3 py-1.5 text-xs font-bold hover:bg-primary-dark transition cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 grid place-items-center text-xs text-muted-foreground">
                    Select a conversation to start chatting
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Wallet & Subscriptions Tab */}
          {activeTab === "wallet" && (
            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border/40 shadow-sm p-5 grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Available Balance</div>
                  <div className="text-3xl font-black text-primary mt-1">
                    KSh {Number(profile?.wallet_balance || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use your wallet balance to instantly pay ad fees, boost listings, or subscribe.
                  </p>
                </div>
                <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5">
                  <div className="text-xs font-bold text-foreground">Top-Up Wallet via M-Pesa</div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={50}
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(Number(e.target.value))}
                      placeholder="Amount"
                      className="w-28 rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none"
                    />
                    <button
                      disabled={topupLoading}
                      onClick={handleTopupWallet}
                      className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 transition disabled:opacity-60 cursor-pointer"
                    >
                      {topupLoading ? "Processing..." : "Top Up via M-Pesa"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Tab */}
          {activeTab === "verification" && (
            <div className="bg-card rounded-xl border border-border/40 shadow-sm p-5 space-y-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-bold text-sm">Seller Verification Badge</h3>
                  <p className="text-xs text-muted-foreground">
                    Get a "Verified Seller" badge on all your listings to build buyer trust and get 3x more inquiries.
                  </p>
                </div>
              </div>

              {/* Step 1: Phone OTP */}
              <div className="rounded-xl border border-border/70 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold">1. Phone Number Verification</div>
                  {profile?.is_phone_verified ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                      Unverified
                    </span>
                  )}
                </div>
                {!profile?.is_phone_verified && (
                  <div className="space-y-2">
                    {!verifyingPhone ? (
                      <button
                        onClick={() => {
                          setVerifyingPhone(true);
                          toast.info("Dev simulation: OTP code is '123456'");
                        }}
                        className="rounded-lg bg-primary text-white text-xs font-bold px-3 py-1.5 hover:bg-primary-dark transition cursor-pointer"
                      >
                        Send OTP to {phoneToVerify || profile?.phone}
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter 6-digit OTP (e.g. 123456)"
                          className="flex-1 rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none"
                        />
                        <button
                          onClick={handleVerifyPhoneOtp}
                          className="rounded-lg bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 cursor-pointer"
                        >
                          Confirm OTP
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: National ID / KRA Document */}
              <div className="rounded-xl border border-border/70 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold">2. National ID / KRA PIN Upload</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    profile?.verification_status === "verified"
                      ? "text-emerald-700 bg-emerald-50 border-emerald-300"
                      : profile?.verification_status === "pending"
                      ? "text-amber-700 bg-amber-50 border-amber-300"
                      : "text-muted-foreground bg-muted border-border"
                  }`}>
                    {profile?.verification_status || "Not submitted"}
                  </span>
                </div>
                {profile?.verification_status !== "verified" && (
                  <form onSubmit={handleSubmitIdVerification} className="space-y-2">
                    <input
                      type="text"
                      value={idDocUrl}
                      onChange={(e) => setIdDocUrl(e.target.value)}
                      placeholder="Document image URL or Cloud link"
                      className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none"
                    />
                    <input
                      type="text"
                      value={kraPin}
                      onChange={(e) => setKraPin(e.target.value.toUpperCase())}
                      placeholder="KRA PIN (Optional e.g. A012345678Z)"
                      className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-primary text-white text-xs font-bold px-3 py-1.5 hover:bg-primary-dark transition cursor-pointer"
                    >
                      Submit for Admin Verification
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Saved Searches Tab */}
          {activeTab === "saved" && (
            <div className="space-y-3">
              {savedSearches.map((s) => (
                <div key={s.id} className="bg-card rounded-xl border border-border/40 p-3 flex items-center justify-between shadow-sm">
                  <div>
                    <div className="font-bold text-xs">{s.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Params: {JSON.stringify(s.query_params)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to="/browse"
                      search={s.query_params}
                      className="rounded-lg bg-primary text-white px-3 py-1 text-xs font-bold hover:bg-primary-dark transition"
                    >
                      View Results
                    </Link>
                    <button
                      onClick={async () => {
                        await doDeleteSavedSearch({ data: { id: s.id } });
                        setSavedSearches(prev => prev.filter(x => x.id !== s.id));
                        toast.success("Saved search removed.");
                      }}
                      className="text-destructive p-1 rounded hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {!savedSearches.length && (
                <div className="text-center py-10 bg-card rounded-xl border border-border/40 text-xs text-muted-foreground">
                  No saved searches. You can save searches from the Browse page.
                </div>
              )}
            </div>
          )}

          {/* Bulk CSV Tab */}
          {activeTab === "bulk" && (
            <div className="bg-card rounded-xl border border-border/40 shadow-sm p-5 space-y-3">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4 text-primary" /> Bulk CSV Import
              </h3>
              <p className="text-xs text-muted-foreground">
                Paste CSV data (headers: title, description, price, category, town) to post multiple listings at once.
              </p>
              <textarea
                rows={6}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="title,description,price,category,town&#10;Toyota Probox,Good condition 2018,650000,vehicles,Nairobi&#10;Water Tank 1000L,Roto tank,12000,home-living,Nakuru"
                className="w-full font-mono text-xs rounded-xl border border-input bg-card p-3 outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                disabled={importingCsv || !csvContent.trim()}
                onClick={handleBulkImport}
                className="rounded-xl bg-primary text-white px-4 py-2 text-xs font-bold hover:bg-primary-dark transition disabled:opacity-60 cursor-pointer"
              >
                {importingCsv ? "Importing..." : "Import Listings"}
              </button>
            </div>
          )}

          {/* Orders & Escrow Tab */}
          {activeTab === "orders" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm">Orders & Escrow</h3>
              </div>
              {orders.length === 0 && (
                <div className="text-center py-12 bg-card rounded-xl border border-border/40 text-xs text-muted-foreground">
                  No orders yet. When you buy or sell via escrow, orders will appear here.
                </div>
              )}
              {orders.map((order: any) => (
                <div key={order.id} className="bg-card rounded-xl border border-border/40 shadow-sm p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate">{order.listing?.title ?? "Listing"}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Order #{order.id.slice(0, 8)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs font-black text-primary">KSh {Number(order.amount).toLocaleString()}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        order.status === "held" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        order.status === "released" ? "bg-green-50 text-green-700 border-green-200" :
                        order.status === "disputed" ? "bg-red-50 text-red-600 border-red-200" :
                        "bg-muted text-muted-foreground"
                      }`}>{order.status}</span>
                    </div>
                  </div>
                  {order.courier_name && (
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3 w-3" /> {order.courier_name}
                      {order.tracking_number && <span className="font-mono ml-1">{order.tracking_number}</span>}
                    </div>
                  )}
                  {order.delivery_address && (
                    <div className="text-[10px] text-muted-foreground">📍 {order.delivery_address}</div>
                  )}
                  <div className="flex gap-2 flex-wrap pt-1">
                    {order.status === "held" && order.buyer_id && (
                      <button
                        onClick={async () => {
                          try {
                            await doConfirmDelivery({ data: { order_id: order.id } });
                            toast.success("Delivery confirmed! Funds released to seller.");
                            setOrders(prev => prev.map((o: any) => o.id === order.id ? { ...o, status: "released" } : o));
                          } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
                        }}
                        className="rounded-lg bg-green-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-green-700 transition cursor-pointer"
                      >
                        ✓ Confirm Delivery & Release Funds
                      </button>
                    )}
                    {order.status === "held" && !disputeModalOrder && (
                      <button
                        onClick={() => setDisputeModalOrder(order)}
                        className="rounded-lg bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 text-xs font-bold hover:bg-red-100 transition cursor-pointer flex items-center gap-1"
                      >
                        <AlertTriangle className="h-3 w-3" /> Open Dispute
                      </button>
                    )}
                    {order.status === "held" && order.seller_id && (
                      <select
                        defaultValue={order.delivery_status ?? ""}
                        onChange={async (e) => {
                          const status = e.target.value as "shipped" | "in_transit" | "delivered";
                          if (!status) return;
                          try {
                            await doUpdateDelivery({ data: { order_id: order.id, status } });
                            toast.success("Delivery status updated");
                          } catch (err) { toast.error("Failed to update delivery status"); }
                        }}
                        className="rounded-lg border border-input bg-card px-2 py-1 text-xs"
                      >
                        <option value="">Update Shipping…</option>
                        <option value="shipped">Shipped</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
              {/* Dispute Modal */}
              {disputeModalOrder && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setDisputeModalOrder(null)}>
                  <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold text-sm flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-red-500" /> Open Dispute
                    </h3>
                    <p className="text-xs text-muted-foreground">Describe the issue with order #{disputeModalOrder.id.slice(0, 8)}</p>
                    <select
                      value={disputeReason}
                      onChange={e => setDisputeReason(e.target.value)}
                      className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-xs"
                    >
                      <option value="">Select reason…</option>
                      <option value="item_not_received">Item Not Received</option>
                      <option value="item_not_as_described">Item Not As Described</option>
                      <option value="damaged_item">Damaged Item</option>
                      <option value="seller_unresponsive">Seller Unresponsive</option>
                      <option value="other">Other</option>
                    </select>
                    <textarea
                      rows={3}
                      value={disputeDetails}
                      onChange={e => setDisputeDetails(e.target.value)}
                      placeholder="Provide details about the dispute..."
                      className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setDisputeModalOrder(null)} className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold hover:bg-muted">Cancel</button>
                      <button
                        disabled={submittingDispute || !disputeReason}
                        onClick={async () => {
                          setSubmittingDispute(true);
                          try {
                            await doOpenDispute({ data: { order_id: disputeModalOrder.id, reason: disputeReason, details: disputeDetails } });
                            toast.success("Dispute opened. Admin will review within 24h.");
                            setDisputeModalOrder(null);
                            setDisputeReason(""); setDisputeDetails("");
                            setOrders(prev => prev.map((o: any) => o.id === disputeModalOrder.id ? { ...o, status: "disputed" } : o));
                          } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
                          finally { setSubmittingDispute(false); }
                        }}
                        className="flex-1 rounded-xl bg-red-600 text-white py-2 text-xs font-bold hover:bg-red-700 transition disabled:opacity-60"
                      >
                        {submittingDispute ? "Submitting…" : "Submit Dispute"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Seller Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm">Seller Analytics</h3>
              </div>
              {analyticsData ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Total Views", value: analyticsData.totalViews ?? 0, icon: BarChart3, color: "bg-blue-50 text-blue-700" },
                      { label: "Contact Clicks", value: analyticsData.totalContacts ?? 0, icon: Users, color: "bg-orange-50 text-orange-700" },
                      { label: "Offers Received", value: analyticsData.totalOffers ?? 0, icon: HandCoins, color: "bg-amber-50 text-amber-700" },
                      { label: "Conversion Rate", value: `${analyticsData.conversionRate ?? 0}%`, icon: RotateCw, color: "bg-green-50 text-green-700" },
                    ].map(stat => (
                      <div key={stat.label} className="bg-card border border-border/40 rounded-xl shadow-sm p-3 flex items-center gap-2.5">
                        <div className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${stat.color}`}>
                          <stat.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-lg font-extrabold">{stat.value}</div>
                          <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-border/40">
                      <h4 className="font-bold text-xs">Top Listings Performance</h4>
                    </div>
                    <div className="divide-y divide-border/30">
                      {(analyticsData.topListings ?? []).map((listing: any) => {
                        const daysLeft = listing.ad_expires_at
                          ? Math.max(0, Math.ceil((new Date(listing.ad_expires_at).getTime() - Date.now()) / 86400000))
                          : null;
                        return (
                          <div key={listing.id} className="flex items-center gap-3 px-4 py-2.5">
                            {listing.image_url && (
                              <img src={listing.image_url} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold truncate">{listing.title}</div>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                <span>{listing.views_count ?? 0} views</span>
                                <span>{listing.contact_clicks_count ?? 0} contacts</span>
                                {daysLeft !== null && (
                                  <span className={daysLeft <= 3 ? "text-red-500 font-bold" : ""}>
                                    {daysLeft}d left
                                  </span>
                                )}
                              </div>
                            </div>
                            {daysLeft !== null && daysLeft <= 7 && (
                              <button
                                onClick={async () => {
                                  try {
                                    await doRenewListing({ data: { listing_id: listing.id } });
                                    toast.success("Listing renewed for 30 days!");
                                  } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
                                }}
                                className="shrink-0 rounded-lg bg-primary text-white px-2 py-1 text-[10px] font-bold hover:bg-primary-dark transition cursor-pointer flex items-center gap-1"
                              >
                                <RotateCw className="h-2.5 w-2.5" /> Renew
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {!(analyticsData.topListings?.length) && (
                        <div className="text-center py-8 text-xs text-muted-foreground">No listing data yet.</div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 bg-card rounded-xl border border-border/40 text-xs text-muted-foreground">
                  Loading analytics…
                </div>
              )}
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === "favorites" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-red-500" />
                <h3 className="font-bold text-sm">My Favorites</h3>
              </div>
              {favorites.length === 0 && (
                <div className="text-center py-12 bg-card rounded-xl border border-border/40 text-xs text-muted-foreground">
                  No saved favorites yet. Tap the ❤ heart on any listing to save it here.
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {favorites.map((fav: any) => {
                  const listing = fav.listing;
                  if (!listing) return null;
                  return (
                    <div key={fav.id} className="bg-card border border-border/40 rounded-xl shadow-sm overflow-hidden relative group">
                      <button
                        onClick={async () => {
                          try {
                            await doToggleFav({ data: { listing_id: listing.id } });
                            setFavorites(prev => prev.filter((f: any) => f.id !== fav.id));
                            toast.success("Removed from favorites");
                          } catch (e) { toast.error("Failed"); }
                        }}
                        className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full bg-white/80 backdrop-blur grid place-items-center text-red-500 hover:bg-red-50 transition"
                      >
                        <Heart className="h-3.5 w-3.5 fill-current" />
                      </button>
                      {listing.image_url ? (
                        <img src={listing.image_url} alt={listing.title} className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-24 bg-muted grid place-items-center text-muted-foreground text-[10px]">No Image</div>
                      )}
                      <div className="p-2">
                        <div className="text-xs font-bold truncate">{listing.title}</div>
                        <div className="text-[10px] font-bold text-primary mt-0.5">KSh {Number(listing.price).toLocaleString()}</div>
                        <a
                          href={`/listing/${listing.id}`}
                          className="mt-1.5 block text-center rounded-lg bg-primary/10 text-primary text-[10px] font-bold py-1 hover:bg-primary/20 transition"
                        >
                          View Listing
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === "referrals" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm">Refer & Earn</h3>
              </div>
              {referralInfo && (
                <>
                  <div className="bg-gradient-to-br from-primary/10 to-orange-50 border border-primary/20 rounded-2xl p-5 space-y-3">
                    <div className="text-xs font-semibold text-muted-foreground">Your Referral Code</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xl font-black tracking-widest text-primary bg-white rounded-xl px-4 py-2 border border-primary/20 select-all">
                        {referralInfo.referral_code}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(referralInfo.referral_code);
                          toast.success("Referral code copied!");
                        }}
                        className="rounded-xl bg-primary text-white px-3 py-2 text-xs font-bold hover:bg-primary-dark transition cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Share this code with sellers. When they sign up and list their first item, you both earn a reward!
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card border border-border/40 rounded-xl p-4 text-center shadow-sm">
                      <div className="text-2xl font-black text-primary">{referralInfo.total_referrals_count ?? 0}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">Sellers Referred</div>
                    </div>
                    <div className="bg-card border border-border/40 rounded-xl p-4 text-center shadow-sm">
                      <div className="text-2xl font-black text-green-600">
                        KSh {((referralInfo.total_referrals_count ?? 0) * 50).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">Total Earned (est.)</div>
                    </div>
                  </div>
                  {referralInfo.referrals && referralInfo.referrals.length > 0 && (
                    <div className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-border/40">
                        <h4 className="font-bold text-xs">Referred Sellers</h4>
                      </div>
                      <div className="divide-y divide-border/30">
                        {referralInfo.referrals.map((r: any) => (
                          <div key={r.id} className="px-4 py-2.5 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-semibold">{r.full_name || r.email || "Unknown"}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {new Date(r.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-green-600">+KSh 50</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {!referralInfo && (
                <div className="text-center py-12 bg-card rounded-xl border border-border/40 text-xs text-muted-foreground">
                  Loading referral info…
                </div>
              )}
            </div>
          )}

          {/* Boost Modal */}
          {boostModalListing && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setBoostModalListing(null)}>
              <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-500" /> Boost Listing
                  </h3>
                  <button onClick={() => setBoostModalListing(null)} className="text-muted-foreground">✕</button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Promote <b>{boostModalListing.title}</b> to the top of browse and category results.
                </p>
                <div className="space-y-2">
                  {[
                    { id: "boosted", label: "Boosted", price: 100, desc: "Highlighted at top of category", icon: Sparkles },
                    { id: "urgent", label: "Urgent", price: 150, desc: "Eye-catching Urgent badge", icon: Flame },
                    { id: "featured", label: "Featured", price: 200, desc: "Homepage showcase & top rank", icon: Sparkles },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBoostTier(t.id as any)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                        boostTier === t.id ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{t.label}</div>
                        <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                      </div>
                      <span className="text-xs font-black text-primary">KSh {t.price}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setBoostModalListing(null)} className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold hover:bg-muted">Cancel</button>
                  <button
                    disabled={boosting}
                    onClick={handleBoostListing}
                    className="flex-1 rounded-xl bg-primary text-white py-2 text-xs font-bold hover:bg-primary-dark transition disabled:opacity-60"
                  >
                    {boosting ? "Boosting..." : "Confirm & Pay"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
