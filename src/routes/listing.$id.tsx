import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  makeOffer,
  startOrGetConversation,
  sendMessage,
  submitReview,
  getSellerReviews,
  reportListingOrUser,
  incrementListingView,
  createEscrowOrder,
  toggleFavorite,
  toggleFollowSeller,
  recordContactClick,
} from "@/lib/marketplace.functions";
import { evaluateListingSafety } from "@/lib/safety-heuristics";
import { KENYA_COURIERS, calculateEstimatedDeliveryFee } from "@/lib/logistics-couriers";
import { useLanguage } from "@/lib/i18n";
import { Header, Footer } from "@/components/site-chrome";
import { toast } from "sonner";
import {
  MessageCircle,
  Phone,
  Lock,
  MapPin,
  ShoppingBag,
  Wrench,
  Users,
  HeartHandshake,
  ShieldCheck,
  AlertTriangle,
  Star,
  Flag,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Flame,
  Send,
  Info,
  Heart,
  Share2,
  Truck,
  UserPlus,
  UserCheck,
  Wallet,
  ShieldAlert,
} from "lucide-react";

export const Route = createFileRoute("/listing/$id")({
  component: ListingPage,
  head: ({ params }) => ({
    meta: [
      { title: `Listing on Sokonyumbani` },
      {
        name: "description",
        content: `View listing ${params.id} on Sokonyumbani — Kenya's local marketplace.`,
      },
    ],
  }),
});

type Listing = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  images?: string[] | null;
  specs?: Record<string, any> | null;
  promotion_tier?: string | null;
  views_count?: number | null;
  seller_id: string;
  status: string;
  county_id: number | null;
  subcounty_id: number | null;
  ward_id: number | null;
  town: string | null;
  listing_type: "sale" | "hire" | "service" | "donation" | null;
  work_rate_type: string | null;
  landmark: string | null;
  donation_recipient: string | null;
  offers_delivery: boolean | null;
  transport_means: string | null;
  payment_methods: string[] | null;
  job_title: string | null;
  education_level: string | null;
  languages: string[] | null;
  experience_years: number | null;
  self_description: string | null;
};
type Seller = {
  full_name: string;
  phone: string;
  email: string;
  verification_status?: string | null;
  is_phone_verified?: boolean | null;
};

const LISTING_TYPE_CONFIG: Record<string, { label: string; icon: typeof ShoppingBag; color: string }> = {
  sale: { label: "For Sale", icon: ShoppingBag, color: "bg-primary/10 text-primary-dark border-primary/20" },
  hire: { label: "For Hire", icon: Wrench, color: "bg-amber-500/10 text-amber-700 border-amber-200" },
  service: { label: "Service", icon: Users, color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  donation: { label: "Donation", icon: HeartHandshake, color: "bg-rose-500/10 text-rose-700 border-rose-200" },
};

const WORK_RATE_LABEL: Record<string, string> = {
  hourly: " / hour",
  weekly: " / week",
  monthly: " / month",
  agreed: " (agreed)",
};

function ListingPage() {
  const { id } = Route.useParams();
  const submit = useServerFn(makeOffer);
  const doStartChat = useServerFn(startOrGetConversation);
  const doSendMessage = useServerFn(sendMessage);
  const doSubmitReview = useServerFn(submitReview);
  const doGetReviews = useServerFn(getSellerReviews);
  const doReport = useServerFn(reportListingOrUser);
  const doIncrementView = useServerFn(incrementListingView);
  const doEscrowOrder = useServerFn(createEscrowOrder);
  const doToggleFavorite = useServerFn(toggleFavorite);
  const doToggleFollow = useServerFn(toggleFollowSeller);
  const doRecordContact = useServerFn(recordContactClick);
  const { lang, t } = useLanguage();

  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [countyName, setCountyName] = useState<string>("");
  const [subCountyName, setSubCountyName] = useState<string>("");
  const [wardName, setWardName] = useState<string>("");
  const [me, setMe] = useState<string | null>(null);
  const [myOffer, setMyOffer] = useState<{ id: string; status: string; amount: number } | null>(
    null,
  );
  const [amount, setAmount] = useState<number>(0);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);

  // New features state
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("scam");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatConvId, setChatConvId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [similarListings, setSimilarListings] = useState<any[]>([]);

  // Engagement & Escrow state
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFollowingSeller, setIsFollowingSeller] = useState(false);
  const [escrowModalOpen, setEscrowModalOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState(KENYA_COURIERS[0].id);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [escrowPaymentMethod, setEscrowPaymentMethod] = useState<"wallet" | "mpesa">("wallet");
  const [submittingEscrow, setSubmittingEscrow] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  async function load() {
    const { data: l } = await supabase
      .from("listings")
      .select(
        "id,title,description,price,image_url,images,specs,promotion_tier,views_count,seller_id,status,county_id,subcounty_id,ward_id,town,listing_type,work_rate_type,landmark,donation_recipient,offers_delivery,transport_means,payment_methods,job_title,education_level,languages,experience_years,self_description,category_id",
      )
      .eq("id", id)
      .maybeSingle();
    const listingData = l as (Listing & { category_id?: number | null }) | null;
    setListing(listingData);
    if (listingData) {
      const { data: s } = await supabase
        .from("profiles")
        .select("full_name,phone,email,verification_status,is_phone_verified")
        .eq("id", listingData.seller_id)
        .maybeSingle();
      setSeller(s as Seller | null);
      if (listingData.county_id) {
        const { data: c } = await supabase
          .from("counties")
          .select("name")
          .eq("id", listingData.county_id)
          .maybeSingle();
        setCountyName((c?.name as string) ?? "");
      }
      if (listingData.subcounty_id) {
        const { data: sc } = await supabase
          .from("subcounties")
          .select("name")
          .eq("id", listingData.subcounty_id!)
          .maybeSingle();
        setSubCountyName((sc?.name as string) ?? "");
      }
      if (listingData.ward_id) {
        const { data: w } = await supabase
          .from("wards")
          .select("name")
          .eq("id", listingData.ward_id!)
          .maybeSingle();
        setWardName((w?.name as string) ?? "");
      }
      setAmount(Number(listingData.price));

      // Fetch seller reviews
      try {
        const revs = await doGetReviews({ data: { seller_id: listingData.seller_id } });
        setReviews(revs?.reviews ?? []);
      } catch (e) {
        console.error("Reviews load error", e);
      }

      // Fetch similar listings
      try {
        let simQ = supabase
          .from("listings")
          .select("id,title,price,image_url,town,created_at")
          .eq("status", "active")
          .neq("id", id);
        if (listingData.category_id) {
          simQ = simQ.eq("category_id", listingData.category_id);
        } else if (listingData.county_id) {
          simQ = simQ.eq("county_id", listingData.county_id);
        }
        const { data: sims } = await simQ.limit(4);
        setSimilarListings(sims ?? []);
      } catch (e) {
        console.error("Similar listings error", e);
      }
    }
    const { data: u } = await supabase.auth.getUser();
    setMe(u.user?.id ?? null);
    if (u.user) {
      const { data: o } = await supabase
        .from("offers")
        .select("id,status,amount")
        .eq("listing_id", id)
        .eq("buyer_id", u.user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      setMyOffer((o?.[0] as { id: string; status: string; amount: number } | undefined) ?? null);

      // Check favorite
      const { data: fav } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", u.user.id)
        .eq("listing_id", id)
        .maybeSingle();
      setIsFavorited(!!fav);

      // Check following
      if (listingData?.seller_id) {
        const { data: fol } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", u.user.id)
          .eq("seller_id", listingData.seller_id)
          .maybeSingle();
        setIsFollowingSeller(!!fol);
      }
    }
  }
  useEffect(() => {
    load();
    try {
      doIncrementView({ data: { listing_id: id } });
    } catch {}
  }, [id]);

  async function send() {
    if (!me) {
      window.location.href = "/auth";
      return;
    }
    setLoading(true);
    try {
      await submit({ data: { listing_id: id, amount, message: msg } });
      toast.success(
        listing?.listing_type === "service" ? "Quote request sent to seller." : "Offer sent to seller.",
      );
      await load();
      setMsg("");
      setOfferOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenChat() {
    if (!me) {
      window.location.href = "/auth";
      return;
    }
    try {
      const conv = await doStartChat({ data: { listing_id: id } });
      setChatConvId(conv.conversation_id);
      setChatOpen(true);
    } catch (err) {
      toast.error("Could not initiate conversation.");
    }
  }

  async function handleSendChatMessage() {
    if (!chatInput.trim() || !chatConvId) return;
    setSendingChat(true);
    try {
      await doSendMessage({ data: { conversation_id: chatConvId, content: chatInput.trim() } });
      setChatInput("");
      toast.success("Message sent to seller!");
    } catch (err) {
      toast.error("Failed to send message.");
    } finally {
      setSendingChat(false);
    }
  }

  async function handleAddReview(e: React.FormEvent) {
    e.preventDefault();
    if (!me) {
      toast.error("Please sign in to leave a review.");
      return;
    }
    if (!listing) return;
    setSubmittingReview(true);
    try {
      await doSubmitReview({
        data: {
          listing_id: listing.id,
          rating: reviewRating,
          comment: reviewComment,
        },
      });
      toast.success("Review submitted! Thank you.");
      setReviewComment("");
      const revs = await doGetReviews({ data: { seller_id: listing.seller_id } });
      setReviews(revs?.reviews ?? []);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      await doReport({
        data: {
          listing_id: id,
          reported_user_id: listing?.seller_id,
          reason: reportReason,
          details: reportDetails,
        },
      });
      toast.success("Report received. Our moderation team will investigate.");
      setReportOpen(false);
      setReportDetails("");
    } catch (err) {
      toast.error("Failed to submit report.");
    } finally {
      setSubmittingReport(false);
    }
  }

  async function handleToggleFav() {
    if (!me) {
      toast.error("Sign in to save items to your favorites.");
      return;
    }
    try {
      const res = await doToggleFavorite({ data: { listing_id: id } });
      setIsFavorited(res.favorited);
      toast.success(res.favorited ? "Added to favorites ❤️" : "Removed from favorites");
    } catch (err: any) {
      toast.error(err.message || "Failed to update favorites.");
    }
  }

  async function handleToggleSellerFollow() {
    if (!me) {
      toast.error("Sign in to follow sellers.");
      return;
    }
    if (!listing?.seller_id) return;
    try {
      const res = await doToggleFollow({ data: { seller_id: listing.seller_id } });
      setIsFollowingSeller(res.following);
      toast.success(res.following ? "Following seller! You'll see their latest posts." : "Unfollowed seller");
    } catch (err: any) {
      toast.error(err.message || "Failed to follow seller.");
    }
  }

  function handleTrackContactClick() {
    try {
      doRecordContact({ data: { listing_id: id } });
    } catch {
      // ignore
    }
  }

  async function handleCreateEscrow() {
    if (!me) {
      toast.error("Please sign in to place an escrow order.");
      return;
    }
    if (!deliveryAddress.trim()) {
      toast.error("Please provide a destination town and pickup point/address.");
      return;
    }
    if (!listing) return;

    setSubmittingEscrow(true);
    const courierFee = calculateEstimatedDeliveryFee(selectedCourier, 2, false);

    try {
      const res = await doEscrowOrder({
        data: {
          listing_id: listing.id,
          amount: Number(listing.price),
          delivery_fee: courierFee,
          courier_partner: selectedCourier,
          delivery_address: deliveryAddress.trim(),
          payment_method: escrowPaymentMethod,
        },
      });

      toast.success(`Escrow order created! Tracking #${res.tracking_number}. Seller has been notified to dispatch.`);
      setEscrowModalOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to create escrow order.");
    } finally {
      setSubmittingEscrow(false);
    }
  }

  if (!listing)
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 grid place-items-center">Loading…</main>
        <Footer />
      </div>
    );

  const accepted = myOffer?.status === "accepted";
  const contactVisible = accepted || me === listing.seller_id;
  const typeConfig = listing.listing_type ? LISTING_TYPE_CONFIG[listing.listing_type] : null;
  const priceSuffix =
    listing.listing_type === "service" && listing.work_rate_type
      ? WORK_RATE_LABEL[listing.work_rate_type] ?? ""
      : "";

  // Build location breadcrumb: County › Sub-County › Ward › Town
  const locationParts = [
    listing.town,
    wardName,
    subCountyName,
    countyName,
  ].filter(Boolean);
  const locationLabel = locationParts.reverse().join(" › ");

  const isService = listing.listing_type === "service";

  const allImages = Array.isArray(listing.images) && listing.images.length > 0
    ? listing.images
    : listing.image_url
    ? [listing.image_url]
    : [];

  const safetyEvaluation = evaluateListingSafety({
    title: listing.title,
    description: listing.description || "",
    price: Number(listing.price),
    listing_type: listing.listing_type,
    contact_phone: seller?.phone,
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc: number, r: any) => acc + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background py-4">
        {/* Rich SEO JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": listing.title,
              "image": allImages.length > 0 ? allImages : undefined,
              "description": listing.description || `${listing.title} available on Sokonyumbani Kenya`,
              "offers": {
                "@type": "Offer",
                "priceCurrency": "KES",
                "price": listing.price,
                "availability": listing.status === "active" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
                "seller": {
                  "@type": "Person",
                  "name": seller?.full_name || "Sokonyumbani Seller",
                },
              },
            }),
          }}
        />
        <div className="mx-auto max-w-5xl px-4 grid md:grid-cols-[1.2fr_1fr] gap-5">
          <div>
            {/* Multi-Photo Gallery */}
            <div className="space-y-2">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted ring-1 ring-black/5 relative group">
                {allImages.length > 0 ? (
                  <img
                    src={allImages[activePhotoIdx] || allImages[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setActivePhotoIdx((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
                      {activePhotoIdx + 1} / {allImages.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition ${
                        activePhotoIdx === idx ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Badges */}
            <div className="mt-3.5 flex items-start gap-2.5 flex-wrap">
              {typeConfig && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${typeConfig.color} shrink-0`}
                >
                  <typeConfig.icon className="h-3 w-3" />
                  {typeConfig.label}
                </span>
              )}
              {listing.promotion_tier === "featured" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500 text-white shadow-sm shrink-0">
                  <Sparkles className="h-3 w-3" /> FEATURED
                </span>
              )}
              {listing.promotion_tier === "urgent" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-rose-600 text-white shadow-sm shrink-0">
                  <Flame className="h-3 w-3" /> URGENT
                </span>
              )}
              <div className="flex items-start justify-between gap-2 w-full">
                <h1 className="text-xl font-extrabold text-primary-dark flex-1">{listing.title}</h1>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleToggleFav}
                    title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      isFavorited ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-card border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isFavorited ? "fill-rose-500 text-rose-500" : ""}`} />
                  </button>
                  <button
                    onClick={() => setShareOpen(!shareOpen)}
                    title="Share listing"
                    className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground transition cursor-pointer"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Social Share Menu */}
              {shareOpen && (
                <div className="w-full bg-muted/40 p-2.5 rounded-xl border border-border/70 flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[11px] font-bold text-muted-foreground">Share:</span>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Check out ${listing.title} on Sokonyumbani: ${window.location.href}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${listing.title} on Sokonyumbani`)}&url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-black text-white font-bold hover:bg-neutral-800 transition"
                  >
                    X (Twitter)
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Listing link copied to clipboard!");
                      setShareOpen(false);
                    }}
                    className="px-2.5 py-1 rounded-lg border border-border bg-card font-semibold hover:bg-muted transition"
                  >
                    Copy Link
                  </button>
                </div>
              )}
            </div>

            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              {locationLabel && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{locationLabel}</span>
                </div>
              )}
              {listing.views_count !== undefined && listing.views_count !== null && (
                <div className="flex items-center gap-1 text-[11px]">
                  <Eye className="h-3 w-3" />
                  <span>{listing.views_count} views</span>
                </div>
              )}
            </div>

            <div className="mt-2 text-2xl font-black text-primary">
              KSh {Number(listing.price).toLocaleString()}
              {priceSuffix && (
                <span className="text-sm font-semibold text-muted-foreground ml-1">{priceSuffix}</span>
              )}
            </div>

            {/* Fraud/Scam warning banner if flagged */}
            {safetyEvaluation.risk === "high" && (
              <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-destructive flex items-start gap-2 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Caution: Suspicious Listing Indicators Detected</div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    {safetyEvaluation.warnings.join(". ")}. Always inspect goods in person and never send money before meeting!
                  </div>
                </div>
              </div>
            )}

            {/* Category Specs Details Card */}
            {listing.specs && Object.keys(listing.specs).length > 0 && (
              <div className="mt-4 rounded-xl border border-border bg-card p-3.5 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-primary" /> Item Specifications
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.entries(listing.specs).map(([k, v]) => (
                    <div key={k} className="bg-muted/40 rounded-lg p-2 text-xs">
                      <div className="text-[10px] text-muted-foreground capitalize">{k.replace(/_/g, " ")}</div>
                      <div className="font-bold text-foreground capitalize mt-0.5">{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {listing.description && (
              <p className="mt-4 text-xs md:text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {listing.description}
              </p>
            )}

            {listing.listing_type === "service" && (
              <div className="mt-4 rounded-lg bg-accent/20 p-3 space-y-1.5 text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-primary-dark">Service Provider</div>
                {listing.job_title && <div><b>Job:</b> {listing.job_title}</div>}
                {listing.education_level && <div><b>Education:</b> {listing.education_level.toUpperCase()}</div>}
                {listing.experience_years != null && <div><b>Experience:</b> {listing.experience_years} yr(s)</div>}
                {listing.languages && listing.languages.length > 0 && <div><b>Languages:</b> {listing.languages.join(", ")}</div>}
                {listing.self_description && <div className="pt-1 whitespace-pre-wrap">{listing.self_description}</div>}
              </div>
            )}

            {(listing.offers_delivery || (listing.payment_methods && listing.payment_methods.length > 0)) && (
              <div className="mt-3 rounded-lg bg-muted/40 p-3 space-y-1.5 text-xs">
                {listing.offers_delivery && (
                  <div><b>Delivery:</b> Available{listing.transport_means ? ` (${listing.transport_means})` : ""}</div>
                )}
                {listing.payment_methods && listing.payment_methods.length > 0 && (
                  <div><b>Payment:</b> {listing.payment_methods.join(", ")}</div>
                )}
              </div>
            )}

            {/* Ratings & Reviews Section */}
            <div className="mt-6 border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  Seller Ratings & Reviews ({reviews.length})
                  {avgRating && <span className="text-primary font-black ml-1">★ {avgRating}</span>}
                </h3>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="bg-card border border-border/60 rounded-xl p-3 shadow-sm text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-foreground">{r.reviewer?.full_name || "Buyer"}</span>
                        <div className="flex items-center text-amber-500">
                          {[...Array(Number(r.rating || 5))].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-500" />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-muted-foreground mt-1">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-4">No reviews yet for this seller.</p>
              )}

              {/* Leave Review Form */}
              {me && me !== listing.seller_id && (
                <form onSubmit={handleAddReview} className="bg-muted/30 border border-border/70 rounded-xl p-3.5 space-y-2.5">
                  <div className="text-xs font-bold text-foreground">Write a Review</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setReviewRating(s)}
                          className="text-amber-500 focus:outline-none"
                        >
                          <Star className={`h-4 w-4 ${reviewRating >= s ? "fill-amber-500" : "stroke-muted-foreground"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Describe your transaction experience with this seller..."
                    className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="rounded-lg bg-primary text-white text-xs font-bold px-3 py-1.5 hover:bg-primary-dark transition disabled:opacity-60"
                  >
                    {submittingReview ? "Submitting..." : "Post Review"}
                  </button>
                </form>
              )}
            </div>

            {/* Similar Listings Carousel/Grid */}
            {similarListings.length > 0 && (
              <div className="mt-8 border-t border-border pt-4">
                <h3 className="text-sm font-bold text-foreground mb-3">Similar Listings You May Like</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {similarListings.map((sim: any) => (
                    <Link
                      key={sim.id}
                      to="/listing/$id"
                      params={{ id: sim.id }}
                      className="group bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm hover:border-primary/40 transition"
                    >
                      <div className="aspect-[4/3] bg-muted relative">
                        {sim.image_url ? (
                          <img src={sim.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-muted-foreground text-[10px]">No image</div>
                        )}
                      </div>
                      <div className="p-2">
                        <div className="text-xs font-bold truncate group-hover:text-primary transition">{sim.title}</div>
                        <div className="text-xs font-black text-primary mt-0.5">KSh {Number(sim.price).toLocaleString()}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="bg-card rounded-xl shadow ring-1 ring-black/5 p-4.5 h-fit sticky top-20 space-y-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Seller Information
              </div>
              <div className="mt-1 flex items-center justify-between">
                <div className="text-base font-bold flex items-center gap-1.5">
                  {seller?.full_name ?? "—"}
                  {seller?.verification_status === "verified" && (
                    <span className="inline-flex items-center gap-0.5 bg-emerald-500/10 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-300">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
              </div>

              {seller?.is_phone_verified && (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> Phone Verified
                </div>
              )}

              <div className="flex items-center gap-2 mt-1">
                <Link
                  to="/store/$userId"
                  params={{ userId: listing.seller_id }}
                  className="text-xs text-primary underline block"
                >
                  Visit seller profile & store
                </Link>
                {me && me !== listing.seller_id && (
                  <button
                    onClick={handleToggleSellerFollow}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                      isFollowingSeller
                        ? "bg-primary/10 text-primary-dark border-primary/30"
                        : "bg-muted text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {isFollowingSeller ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                    {isFollowingSeller ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            </div>

            {/* Action buttons: Chat & Contact */}
            <div className="space-y-2">
              {/* Escrow Buy Button */}
              {me !== listing.seller_id && listing.listing_type !== "service" && listing.listing_type !== "donation" && (
                <button
                  onClick={() => setEscrowModalOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 text-xs font-extrabold transition shadow cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" /> Buy via Escrow (Safe Delivery)
                </button>
              )}

              {me !== listing.seller_id && (
                <button
                  onClick={handleOpenChat}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white px-3 py-2 text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" /> Chat with Seller
                </button>
              )}

              {contactVisible ? (
                <div className="space-y-1.5">
                  <a
                    href={`tel:${seller?.phone}`}
                    onClick={handleTrackContactClick}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary-dark text-white px-3 py-2 text-xs font-bold"
                  >
                    <Phone className="h-3.5 w-3.5" /> Call {seller?.phone}
                  </a>
                  <a
                    href={`https://wa.me/${(seller?.phone ?? "").replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleTrackContactClick}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white ring-1 ring-primary text-primary px-3 py-2 text-xs font-bold hover:bg-primary/5"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                </div>
              ) : (
                <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground flex items-start gap-1.5 border border-border/50">
                  <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    {isService
                      ? "Contact unlocks after the seller accepts your quote request."
                      : "Contact phone unlocks after the seller accepts your offer."}
                  </span>
                </div>
              )}
            </div>

            {/* Offer / Quote Section */}
            <div className="border-t border-border pt-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {isService ? "Request a Quote" : "Make an offer"}
              </div>
              {myOffer && (
                <div
                  className={`mb-2 rounded px-2.5 py-1.5 text-xs font-semibold ${
                    myOffer.status === "accepted"
                      ? "bg-primary/10 text-primary-dark"
                      : myOffer.status === "rejected"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-accent/50 text-foreground"
                  }`}
                >
                  Your {isService ? "quote" : "offer"} of KSh {Number(myOffer.amount).toLocaleString()} is {myOffer.status}.
                </div>
              )}
              {!me ? (
                <div className="bg-muted/50 rounded-lg p-3 text-center border border-border/50">
                  <p className="text-[11px] text-muted-foreground mb-2">
                    You must be signed in to {isService ? "request a quote" : "make an offer"} or contact.
                  </p>
                  <Link
                    to="/auth"
                    search={{ next: `/listing/${id}` }}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-primary text-white py-1.5 text-xs font-bold hover:bg-primary-dark transition"
                  >
                    Sign In
                  </Link>
                </div>
              ) : (
                me !== listing.seller_id && (
                  <>
                    <button
                      onClick={() => {
                        setAmount(myOffer ? Number(myOffer.amount) : Number(listing.price));
                        setOfferOpen(true);
                      }}
                      className="w-full rounded-xl border border-primary text-primary hover:bg-primary/5 px-3 py-2 text-xs font-bold cursor-pointer transition"
                    >
                      {isService ? "Request a Quote" : myOffer ? "Change my offer" : "Make an offer"}
                    </button>
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      The seller sees your offer on their dashboard and can accept it.
                    </p>
                  </>
                )
              )}
            </div>

            {/* Safety Tips Card */}
            <div className="border-t border-border pt-3 rounded-xl bg-amber-500/5 p-3 border border-amber-500/20">
              <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-600" /> Safety Tips for Buyers
              </div>
              <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4">
                <li>Never send money or MPESA deposit before meeting</li>
                <li>Meet the seller in a public, well-lit place</li>
                <li>Inspect item thoroughly before finalizing</li>
              </ul>
              <Link to="/safety" className="text-[10px] text-primary font-bold underline mt-2 block">
                Read full buyer safety guide →
              </Link>
            </div>

            {/* Report Button */}
            <div className="pt-2 border-t border-border flex justify-center">
              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition cursor-pointer"
              >
                <Flag className="h-3 w-3" /> Report this listing
              </button>
            </div>
          </aside>
        </div>

        {/* Offer / Quote Modal */}
        {offerOpen && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
            onClick={() => !loading && setOfferOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-xl bg-card p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-extrabold text-primary-dark">
                    {isService ? "Request a quote" : "Make an offer"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{listing.title}</p>
                </div>
                <button
                  onClick={() => setOfferOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {isService ? "Your budget (KSh)" : "Amount you are willing to pay (KSh)"}
                </label>
                <input
                  type="number"
                  min={1}
                  autoFocus
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="e.g. 4500"
                  className="mt-1 w-full rounded border border-input bg-white px-2.5 py-2 outline-none focus:ring-2 focus:ring-primary text-sm font-semibold"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Asking price: KSh {Number(listing.price).toLocaleString()}
                </p>
              </div>

              <div className="mt-2.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Message {isService ? "" : "(optional)"}
                </label>
                <textarea
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  rows={3}
                  placeholder={isService ? "Describe the job / requirements" : "Add a note for the seller"}
                  className="mt-1 w-full rounded border border-input bg-white px-2.5 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setOfferOpen(false)}
                  disabled={loading}
                  className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition cursor-pointer disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  disabled={loading || !amount || amount <= 0}
                  onClick={send}
                  className="flex-1 rounded-lg bg-primary hover:bg-primary-dark text-white px-3 py-2 text-xs font-bold transition cursor-pointer disabled:opacity-60"
                >
                  {loading ? "Sending…" : isService ? "Send request" : "Send offer"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* In-App Chat Modal */}
        {chatOpen && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
            onClick={() => setChatOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-card p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-bold">Chat with {seller?.full_name || "Seller"}</h3>
                    <p className="text-[11px] text-muted-foreground">Re: {listing.title}</p>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">✕</button>
              </div>

              <div className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground text-center">
                Send a message directly to the seller's inbox. They will see it on their dashboard.
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendChatMessage();
                  }}
                  placeholder="Ask about availability, inspection, price..."
                  className="flex-1 rounded-xl border border-input bg-card px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleSendChatMessage}
                  disabled={sendingChat || !chatInput.trim()}
                  className="rounded-xl bg-primary text-white px-3 py-2 text-xs font-bold hover:bg-primary-dark transition disabled:opacity-60 flex items-center gap-1 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" /> Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {reportOpen && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
            onClick={() => setReportOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-bold flex items-center gap-1.5 text-destructive">
                  <Flag className="h-4 w-4" /> Report this Listing
                </h3>
                <button onClick={() => setReportOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full mt-1 rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="scam">Potential Scam / Fraud</option>
                    <option value="duplicate">Duplicate or Spam</option>
                    <option value="offensive">Offensive Content</option>
                    <option value="wrong_category">Wrong Category</option>
                    <option value="prohibited">Prohibited Item</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Details (Optional)</label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide any additional context for our moderation team..."
                    className="w-full mt-1 rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold hover:bg-muted cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="flex-1 rounded-xl bg-destructive text-white py-2 text-xs font-bold hover:bg-destructive/90 transition disabled:opacity-60 cursor-pointer"
                  >
                    {submittingReport ? "Sending..." : "Submit Report"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Escrow Purchase / Safe Delivery Modal */}
        {escrowModalOpen && listing && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs"
            onClick={() => setEscrowModalOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-card p-5 shadow-2xl space-y-4 border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Safe Escrow Checkout</h3>
                    <p className="text-[10px] text-muted-foreground">Pay on delivery guarantee</p>
                  </div>
                </div>
                <button onClick={() => setEscrowModalOpen(false)} className="text-muted-foreground hover:text-foreground text-sm">
                  ✕
                </button>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> 100% Buyer Protection
                </p>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Your funds are secured in platform escrow. The seller gets paid <b>only after you receive and inspect</b> the item.
                </p>
              </div>

              {/* Order Summary */}
              <div className="space-y-1.5 text-xs bg-muted/40 p-3 rounded-xl border border-border/60">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item:</span>
                  <span className="font-semibold truncate max-w-[200px]">{listing.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-bold">KSh {Number(listing.price).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Delivery Fee:</span>
                  <span className="font-bold">KSh {calculateEstimatedDeliveryFee(selectedCourier, 2, false)}</span>
                </div>
                <div className="border-t border-border/70 pt-1.5 flex justify-between font-extrabold text-sm text-primary">
                  <span>Total Payable:</span>
                  <span>KSh {(Number(listing.price) + calculateEstimatedDeliveryFee(selectedCourier, 2, false)).toLocaleString()}</span>
                </div>
              </div>

              {/* Courier Partner Selection */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Select Courier Partner
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {KENYA_COURIERS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCourier(c.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                        selectedCourier === c.id
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="font-bold">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">{c.estimatedDelivery}</div>
                      <div className="text-[10px] font-semibold text-primary mt-0.5">KSh {c.baseRateKsh} base</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Delivery Destination & Phone
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Westlands, Nairobi — Near Sarit Centre (0712345678)"
                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Payment Source
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEscrowPaymentMethod("wallet")}
                    className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      escrowPaymentMethod === "wallet" ? "border-primary bg-primary/10 text-primary" : "border-border"
                    }`}
                  >
                    <Wallet className="h-3.5 w-3.5" /> Wallet Balance
                  </button>
                  <button
                    type="button"
                    onClick={() => setEscrowPaymentMethod("mpesa")}
                    className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      escrowPaymentMethod === "mpesa" ? "border-primary bg-primary/10 text-primary" : "border-border"
                    }`}
                  >
                    M-Pesa STK Push
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEscrowModalOpen(false)}
                  className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingEscrow}
                  onClick={handleCreateEscrow}
                  className="flex-1 rounded-xl bg-emerald-600 text-white py-2 text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-60 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {submittingEscrow ? "Securing Funds..." : "Confirm & Pay"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
