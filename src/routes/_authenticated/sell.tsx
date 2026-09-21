import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { computeAdFee, createListing, payListingAd, initiateDarajaStkPush, payWithWallet } from "@/lib/marketplace.functions";
import { Header, Footer } from "@/components/site-chrome";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ChevronLeft, ChevronRight, Sparkles, Flame, X, UploadCloud, Smartphone, Wallet } from "lucide-react";
import { STATIC_SUB_COUNTIES } from "@/lib/location-data";
import { SKILL_CATEGORIES, SERVICE_CATEGORIES, CONSTRUCTION_SUB_CATEGORIES, CONSTRUCTION_SLUGS } from "@/lib/skills-data";
import { CATEGORY_TREE } from "@/lib/category-tree";
import { itemSlug, specialtySlug, slugify } from "@/lib/slug";
import { CATEGORY_SPECS, getSpecCategoryForSlug } from "@/lib/category-specs";

export const Route = createFileRoute("/_authenticated/sell")({ component: SellPage });

type Cat = { id: number; name: string; parent_id: number | null; slug: string };
type County = { id: number; name: string };
type SubCounty = { id: number; county_id: number; name: string };
type Ward = { id: number; county_id: number; sub_county_id: number | null; name: string };

type ListingType = "sale" | "hire" | "service" | "donation";

const PAYMENT_OPTIONS = [
  "M-Pesa",
  "Pochi la Biashara",
  "Airtel Money",
  "T-Kash",
  "Bank Transfer",
  "Cash on Delivery/Receipt",
];
const WORK_RATE_OPTIONS = [
  { v: "hourly", l: "Hourly" },
  { v: "weekly", l: "Weekly" },
  { v: "monthly", l: "Monthly" },
  { v: "agreed", l: "Agreed with employer" },
];
const EDU_OPTIONS: { v: string; l: string }[] = [
  { v: "none", l: "None" },
  { v: "kcpe", l: "KCPE" },
  { v: "kcse", l: "KCSE" },
  { v: "certificate", l: "Certificate" },
  { v: "diploma", l: "Diploma" },
  { v: "degree", l: "Degree" },
];

const TYPES: { v: ListingType; l: string; desc: string }[] = [
  { v: "sale", l: "For Sale", desc: "Sell an item" },
  { v: "hire", l: "For Hire", desc: "Rent out an item" },
  { v: "service", l: "Service / Skill", desc: "Offer your skill" },
  { v: "donation", l: "Donate", desc: "Give to someone in need" },
];

const STEP_LABELS = ["Type & Details", "Location", "Delivery & Payment", "Review & Submit"];

function SellPage() {
  const navigate = useNavigate();
  const compute = useServerFn(computeAdFee);
  const create = useServerFn(createListing);
  const pay = useServerFn(payListingAd);
  const doStkPush = useServerFn(initiateDarajaStkPush);
  const doPayWallet = useServerFn(payWithWallet);

  const [cats, setCats] = useState<Cat[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [subCounties, setSubCounties] = useState<SubCounty[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [step, setStep] = useState<number>(1);
  const [terms, setTerms] = useState<boolean>(true);

  const [listingType, setListingType] = useState<ListingType>("sale");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState<number>(1000);
  const [categoryId, setCategoryId] = useState<number | "">("");

  // Jiji-style Multi-photo gallery & specs
  const [images, setImages] = useState<string[]>([]);
  const [specs, setSpecs] = useState<Record<string, any>>({});
  const [promotionTier, setPromotionTier] = useState<"standard" | "boosted" | "urgent" | "featured">("standard");

  // Cascading category picker for sale/hire/donation ads — Category → Sub-category → Item,
  // exactly mirroring the Buy/Hire (Browse) page's category tree. The chosen item becomes
  // the ad title, the same way Jiji derives a listing's title from its category path.
  const [groupSlug, setGroupSlug] = useState<string>("");
  const [subCategorySlug, setSubCategorySlug] = useState<string>("");
  const [itemLabel, setItemLabel] = useState<string>("");
  const [countyId, setCountyId] = useState<number | "">("");
  const [subCountyId, setSubCountyId] = useState<number | "">("");
  const [wardId, setWardId] = useState<number | "">("");
  const [town, setTown] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [distance, setDistance] = useState<number>(0);
  const [risk, setRisk] = useState<"low" | "medium" | "high">("low");
  const [days, setDays] = useState<number>(7);

  const [offersDelivery, setOffersDelivery] = useState(false);
  const [transport, setTransport] = useState("");
  const [payMethods, setPayMethods] = useState<string[]>(["M-Pesa"]);

  const [education, setEducation] = useState<string>("kcse");
  const [languagesText, setLanguagesText] = useState<string>("Swahili, English");
  const [experience, setExperience] = useState<number>(1);
  const [selfDesc, setSelfDesc] = useState("");
  const [workRateType, setWorkRateType] = useState<string>("hourly");
  const [skillCategorySlug, setSkillCategorySlug] = useState<string>("");
  // For the Construction group, an extra level: construction sub-type slug
  const [constructionSubSlug, setConstructionSubSlug] = useState<string>("");
  // Cascading: Skill Category → Specialty. The chosen specialty becomes the
  // service's title, the same way an item's title comes from its last category.
  const [specialty, setSpecialty] = useState<string>("");
  const [specialties, setSpecialties] = useState<string[]>([]);

  const [donationRecipient, setDonationRecipient] = useState("");
  const [landmark, setLandmark] = useState("");

  const [fee, setFee] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [mpesa, setMpesa] = useState("");
  const [stkPhone, setStkPhone] = useState("");
  const [pushingStk, setPushingStk] = useState(false);
  const [payingWithWallet, setPayingWithWallet] = useState(false);
  const [myWalletBalance, setMyWalletBalance] = useState<number>(0);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id,name,parent_id,slug")
      .order("name")
      .then(({ data }) => setCats((data as Cat[]) ?? []));
    supabase
      .from("counties")
      .select("id,name")
      .order("name")
      .then(({ data }) => setCounties((data as County[]) ?? []));
    supabase
      .from("subcounties")
      .select("id,county_id,name")
      .order("name")
      .then(
        ({ data }) => {
          if (data && data.length > 0) {
            setSubCounties(data as SubCounty[]);
          } else {
            setSubCounties(STATIC_SUB_COUNTIES as SubCounty[]);
          }
        },
        () => {
          setSubCounties(STATIC_SUB_COUNTIES as SubCounty[]);
        }
      );
    (async () => {
      const pageSize = 1000;
      let from = 0;
      const acc: Ward[] = [];
      while (true) {
        const { data, error } = await supabase
          .from("wards")
          .select("id,county_id,sub_county_id:subcounty_id,name")
          .order("name")
          .range(from, from + pageSize - 1);
        if (error || !data) break;
        acc.push(...(data as Ward[]));
        if (data.length < pageSize) break;
        from += pageSize;
      }
      setWards(acc);
    })();

    supabase.auth.getUser().then(({ data }) => {
      if (data.user)
        supabase.from("profiles").select("county_id,ward_id,town,phone").eq("id", data.user.id).maybeSingle().then(({ data: p }) => {
          if (p) {
            setCountyId(p.county_id ?? "");
            setWardId(p.ward_id ?? "");
            setTown(p.town ?? "");
            setContactPhone((p as { phone?: string | null }).phone ?? "");
          }
        });
    });
  }, []);

  useEffect(() => {
    if (!price || !countyId) { setFee(null); return; }
    const t = setTimeout(async () => {
      try {
        const res = await compute({ data: { price, county_id: Number(countyId), distance_km: distance, risk, duration_days: days } });
        setFee(res.fee);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [price, countyId, distance, risk, days, compute]);

  const subCountiesForCounty = subCounties.filter((sc) => sc.county_id === Number(countyId));
  const wardsForSubCounty = wards.filter(
    (w) =>
      w.county_id === Number(countyId) &&
      (subCountyId ? w.sub_county_id === Number(subCountyId) : true),
  );
  // The effective skill category slug: if "construction" is chosen as the top-level
  // category and a construction sub-type has been selected, the effective slug for
  // specialty lookups is the sub-type slug (e.g. "construction-specialist-1").
  const effectiveSkillSlug = skillCategorySlug === "construction" ? constructionSubSlug : skillCategorySlug;
  const activeSkillCategory = SKILL_CATEGORIES.find((c) => c.slug === effectiveSkillSlug);
  const activeConstructionSub = CONSTRUCTION_SUB_CATEGORIES.find((c) => c.slug === constructionSubSlug);
  const isConstructionGroup = skillCategorySlug === "construction";

  // Cascading item category picker (Category → Sub-category → Item), matching
  // the CATEGORY_TREE used by the Buy/Hire page's own category browser.
  const catBySlug = new Map(cats.map((c) => [c.slug, c] as const));
  const selectedGroup = CATEGORY_TREE.find((g) => g.slug === groupSlug);
  const selectedSubCategory = selectedGroup?.children.find((c) => c.slug === subCategorySlug);

  // Keep the derived title and the real DB category_id (used for filtering on
  // /browse) in sync whenever the cascade selection changes. We link to the
  // most specific row available — the exact item if the database has it
  // seeded (see supabase/migrations/20260801090000_category_leaf_taxonomy.sql),
  // falling back gracefully to the sub-category or group otherwise.
  useEffect(() => {
    if (listingType === "service") return;
    if (itemLabel) setTitle(itemLabel);
    const leaf = itemLabel && subCategorySlug ? catBySlug.get(itemSlug(subCategorySlug, itemLabel)) : undefined;
    const dbCat = leaf ?? (subCategorySlug ? catBySlug.get(subCategorySlug) : groupSlug ? catBySlug.get(groupSlug) : undefined);
    setCategoryId(dbCat ? dbCat.id : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemLabel, subCategorySlug, groupSlug, cats, listingType]);

  useEffect(() => {
    if (listingType !== "service") return;
    if (specialty) {
      const formattedTitle = specialty === "TV" ? "TV Repair & Maintenance" : specialty;
      setTitle(formattedTitle);
      setSpecialties([specialty]);
    }
    const leaf = specialty && effectiveSkillSlug ? catBySlug.get(specialtySlug(effectiveSkillSlug, specialty)) : undefined;
    const directSlug = specialty ? catBySlug.get(slugify(specialty)) : undefined;
    const catByPartial = cats.find((c) => {
      const s = specialty.toLowerCase();
      const cn = c.name.toLowerCase();
      return cn.includes(s) || s.includes(cn) || c.slug.includes(slugify(specialty));
    });
    const fallbackGroup = catBySlug.get("semi-pro-services") || catBySlug.get("unskilled-services");
    const dbCat = leaf ?? directSlug ?? catByPartial ?? (effectiveSkillSlug ? catBySlug.get(effectiveSkillSlug) : undefined) ?? fallbackGroup;
    setCategoryId(dbCat ? dbCat.id : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialty, skillCategorySlug, constructionSubSlug, cats, listingType]);

  const togglePay = (m: string) => setPayMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (images.length + files.length > 8) {
      toast.error("Maximum 8 images allowed per ad.");
      return;
    }
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${u.user.id}/${Date.now()}_${i}.${ext}`;
        const { error } = await supabase.storage.from("listing-images").upload(path, file, { upsert: false });
        if (error) throw error;
        const { data: signed } = await supabase.storage.from("listing-images").createSignedUrl(path, 60 * 60 * 24 * 365);
        if (signed?.signedUrl) newUrls.push(signed.signedUrl);
      }
      setImages((prev) => [...prev, ...newUrls]);
      if (!imageUrl && newUrls[0]) setImageUrl(newUrls[0]);
      toast.success(`${newUrls.length} image(s) uploaded.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleRemoveImage(idx: number) {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      setImageUrl(updated[0] || "");
      return updated;
    });
  }

  // Validate the current step so users can't skip required fields
  function validateStep(n: number): string | null {
    if (n === 1) {
      if (listingType === "service") {
        if (!skillCategorySlug) return "Pick a skill category";
        if (isConstructionGroup && !constructionSubSlug) return "Pick a construction type";
        if (!specialty) return "Pick a specialty";
      } else {
        if (!groupSlug) return "Pick a category";
        if (!subCategorySlug) return "Pick a sub-category";
        if (!itemLabel) return "Pick the item that best describes your ad";
        if (listingType !== "donation" && !price) return "Add a price";
      }
    }
    if (n === 2) {
      if (!countyId) return "Pick your county";
      if (!contactPhone) return "Add a contact phone";
    }
    if (n === 3 && listingType === "donation" && !donationRecipient) return "Say who this donation is for";
    return null;
  }
  function next() {
    const err = validateStep(step);
    if (err) { toast.error(err); return; }
    setStep((s) => Math.min(4, s + 1));
  }
  function back() { setStep((s) => Math.max(1, s - 1)); }

  async function submitListing(e: React.FormEvent) {
    e.preventDefault();
    if (!terms) { toast.error("Please accept the terms & conditions"); return; }
    setLoading(true);
    try {
      const finalPrice = listingType === "donation" ? 0 : price;
      const jobTitle = listingType === "service" ? title : null;
      const res = await create({
        data: {
          title,
          description: desc,
          price: finalPrice,
          category_id: categoryId ? Number(categoryId) : null,
          county_id: countyId ? Number(countyId) : null,
          subcounty_id: subCountyId ? Number(subCountyId) : null,
          ward_id: wardId ? Number(wardId) : null,
          town,
          landmark: landmark || null,
          image_url: images[0] || imageUrl || null,
          images: images.length > 0 ? images : imageUrl ? [imageUrl] : [],
          specs: Object.keys(specs).length > 0 ? specs : undefined,
          promotion_tier: promotionTier,
          distance_km: distance,
          risk,
          duration_days: days,
          listing_type: listingType,
          contact_phone: contactPhone || null,
          offers_delivery: listingType === "sale" || listingType === "hire" ? offersDelivery : false,
          transport_means: offersDelivery ? transport || null : null,
          payment_methods: listingType !== "donation" ? payMethods : [],
          job_title: jobTitle,
          specialties: listingType === "service" ? specialties : [],
          education_level: listingType === "service" ? (education as "none"|"kcpe"|"kcse"|"certificate"|"diploma"|"degree") : null,
          languages: listingType === "service" ? languagesText.split(",").map((s) => s.trim()).filter(Boolean) : [],
          experience_years: listingType === "service" ? experience : null,
          self_description: listingType === "service" ? selfDesc : null,
          work_rate_type: listingType === "service" ? (workRateType as "hourly"|"weekly"|"monthly"|"agreed") : null,
          donation_recipient: listingType === "donation" ? donationRecipient || null : null,
        },
      });
      setCreatedId(res.id);
      setFee(res.ad_fee_ksh);
      if (listingType === "donation" || res.ad_fee_ksh === 0) {
        toast.success("Posted! Thank you.");
        navigate({ to: "/thank-you", search: { url: `/listing/${res.id}`, listing: res.id } });
        return;
      }
      toast.success("Listing created. Please choose payment method to publish.");
    } catch (err) {
      console.error("Listing submission failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Submission failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleTriggerStk() {
    if (!createdId || !stkPhone) {
      toast.error("Please enter your M-Pesa phone number.");
      return;
    }
    setPushingStk(true);
    try {
      const res = await doStkPush({
        data: {
          phone: stkPhone,
          amount: fee || 100,
          purpose: "ad_fee",
          listing_id: createdId,
        },
      });
      toast.success(res.customerMessage || "STK PIN prompt sent to your phone!");
      if (res.isSimulated) {
        toast.info("Dev simulation: Auto-verifying in 3s...");
        setTimeout(() => {
          navigate({ to: "/thank-you", search: { url: `/listing/${createdId}`, listing: createdId } });
        }, 3000);
      }
    } catch (err: any) {
      toast.error(err.message || "STK push failed.");
    } finally {
      setPushingStk(false);
    }
  }

  async function handlePayWithWallet() {
    if (!createdId) return;
    setPayingWithWallet(true);
    try {
      await doPayWallet({
        data: {
          listing_id: createdId,
          amount: fee || 100,
          purpose: `Ad fee for ${title}`,
        },
      });
      toast.success("Paid successfully using wallet balance!");
      navigate({ to: "/thank-you", search: { url: `/listing/${createdId}`, listing: createdId } });
    } catch (err: any) {
      toast.error(err.message || "Wallet payment failed.");
    } finally {
      setPayingWithWallet(false);
    }
  }

  async function payAd() {
    if (!createdId || !mpesa) return;
    setLoading(true);
    try {
      const res = await pay({ data: { listing_id: createdId, mpesa_ref: mpesa } });
      navigate({ to: "/thank-you", search: { url: res.share_url, listing: createdId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background py-5">
        <div className="mx-auto max-w-2xl px-4">
          <h1 className="text-xl font-extrabold text-primary-dark">Post an Ad</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Reach thousands of Kenyans in your county.</p>

          {!createdId ? (
            <>
              {/* Stepper */}
              <ol className="mt-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide">
                {STEP_LABELS.map((l, i) => {
                  const n = i + 1;
                  const done = n < step;
                  const active = n === step;
                  return (
                    <li key={l} className="flex-1">
                      <div className={`rounded-full px-2.5 py-1.5 text-center ring-1 ${active ? "bg-primary text-white ring-primary" : done ? "bg-primary/10 text-primary-dark ring-primary/30" : "bg-white text-muted-foreground ring-border"}`}>
                        {n}. {l}
                      </div>
                    </li>
                  );
                })}
              </ol>

              <form onSubmit={submitListing} className="mt-3 bg-card rounded-xl shadow ring-1 ring-black/5 p-4 space-y-3">
                {/* ── STEP 1 ─────────────────────────────────────────── */}
                {step === 1 && (
                  <>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">What are you posting?</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                        {TYPES.map((t) => (
                          <button
                            type="button"
                            key={t.v}
                            onClick={() => {
                              setListingType(t.v);
                              setSpecialties([]);
                              setSpecialty("");
                              setSkillCategorySlug("");
                              setConstructionSubSlug("");
                              setGroupSlug("");
                              setSubCategorySlug("");
                              setItemLabel("");
                              setCategoryId("");
                              setTitle("");
                            }}
                            className={`rounded-lg border p-2 text-left transition ${listingType === t.v ? "border-primary bg-primary/10" : "border-border bg-white hover:border-primary/50"}`}
                          >
                            <div className="text-xs font-bold">{t.l}</div>
                            <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {listingType === "service" ? (
                      <>
                        {/* Skill Category select – uses consolidated SERVICE_CATEGORIES with Construction as a group */}
                        <div className={`grid gap-2.5 ${isConstructionGroup ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
                          <Sel
                            label="Skill Category"
                            v={skillCategorySlug}
                            on={(v) => {
                              setSkillCategorySlug(v as string);
                              setConstructionSubSlug("");
                              setSpecialty("");
                            }}
                            opts={[
                              { v: "", l: "Select skill category" },
                              ...SERVICE_CATEGORIES.map((c) => ({ v: c.slug, l: c.name })),
                            ]}
                          />
                          {/* Construction sub-type: only shown when Construction is selected */}
                          {isConstructionGroup && (
                            <Sel
                              label="Construction Type"
                              v={constructionSubSlug}
                              on={(v) => { setConstructionSubSlug(v as string); setSpecialty(""); }}
                              opts={[
                                { v: "", l: "Select construction type" },
                                ...CONSTRUCTION_SUB_CATEGORIES.map((c) => ({ v: c.slug, l: c.shortName })),
                              ]}
                            />
                          )}
                          <Sel
                            label="Specialty"
                            v={specialty}
                            on={(v) => setSpecialty(v as string)}
                            opts={[
                              {
                                v: "",
                                l: !skillCategorySlug
                                  ? "— pick a skill category first"
                                  : isConstructionGroup && !constructionSubSlug
                                  ? "— pick a construction type first"
                                  : activeSkillCategory
                                  ? "Select specialty"
                                  : "— pick a skill category first",
                              },
                              ...(activeSkillCategory?.specialties.map((s) => ({ v: s, l: s })) ?? []),
                            ]}
                          />
                        </div>

                        {specialty && (
                          <div className="rounded-lg bg-accent/30 ring-1 ring-primary/20 px-3 py-2 text-xs">
                            <span className="text-muted-foreground">Ad title (from your category): </span>
                            <span className="font-bold text-primary-dark">{specialty}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <Sel label="Minimum Education" v={education} on={(v) => setEducation(v as string)} opts={EDU_OPTIONS} />
                          <NumField label="Years of Experience" v={experience} on={setExperience} />
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <NumField label="Rate (KSh)" v={price} on={setPrice} required />
                          <Sel label="Work Rate" v={workRateType} on={(v) => setWorkRateType(v as string)} opts={WORK_RATE_OPTIONS} />
                        </div>
                        <Field label="Languages Spoken (comma separated)" v={languagesText} on={setLanguagesText} />
                        <Field label="Brief Self Description (skills, past works)" v={selfDesc} on={setSelfDesc} textarea />
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <Sel
                            label="Category"
                            v={groupSlug}
                            on={(v) => { setGroupSlug(v as string); setSubCategorySlug(""); setItemLabel(""); }}
                            opts={[{ v: "", l: "Select category" }, ...CATEGORY_TREE.map((g) => ({ v: g.slug, l: g.name }))]}
                          />
                          <Sel
                            label="Sub-category"
                            v={subCategorySlug}
                            on={(v) => { setSubCategorySlug(v as string); setItemLabel(""); }}
                            opts={[
                              { v: "", l: selectedGroup ? "Select sub-category" : "— pick a category first" },
                              ...(selectedGroup?.children.map((c) => ({ v: c.slug, l: c.name })) ?? []),
                            ]}
                          />
                          <Sel
                            label="Item"
                            v={itemLabel}
                            on={(v) => setItemLabel(v as string)}
                            opts={[
                              { v: "", l: selectedSubCategory ? "Select item" : "— pick a sub-category first" },
                              ...(selectedSubCategory?.items.map((i) => ({ v: i, l: i })) ?? []),
                            ]}
                          />
                        </div>

                        {itemLabel && (
                          <div className="rounded-lg bg-accent/30 ring-1 ring-primary/20 px-3 py-2 text-xs">
                            <span className="text-muted-foreground">Ad title (from your category): </span>
                            <span className="font-bold text-primary-dark">{itemLabel}</span>
                          </div>
                        )}

                        {/* Dynamic Category Specs (Jiji-style) */}
                        {(() => {
                          const specCat = getSpecCategoryForSlug(subCategorySlug || groupSlug || itemLabel);
                          if (!specCat || !CATEGORY_SPECS[specCat]) return null;
                          const cfg = CATEGORY_SPECS[specCat];
                          return (
                            <div className="mt-3 rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5" /> {cfg.name} (Key Specifications)
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {cfg.fields.map((f) => (
                                  <div key={f.key}>
                                    <div className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                                      {f.label} {f.unit ? `(${f.unit})` : ""}
                                    </div>
                                    {f.type === "select" ? (
                                      <select
                                        value={specs[f.key] || ""}
                                        onChange={(e) => setSpecs((prev) => ({ ...prev, [f.key]: e.target.value }))}
                                        className="w-full rounded-lg border border-input bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary"
                                      >
                                        <option value="">Select {f.label}</option>
                                        {f.options?.map((opt) => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type={f.type === "number" ? "number" : "text"}
                                        value={specs[f.key] || ""}
                                        onChange={(e) => setSpecs((prev) => ({ ...prev, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder}
                                        className="w-full rounded-lg border border-input bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        <Field label="Description" v={desc} on={setDesc} textarea />
                        {listingType !== "donation" ? (
                          <NumField label={listingType === "hire" ? "Rental price (KSh)" : "Price (KSh)"} v={price} on={setPrice} required />
                        ) : (
                          <div className="rounded-lg bg-accent/20 px-3 py-2 text-xs text-accent-foreground/80">Donations are free — no price.</div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* ── STEP 2 ─────────────────────────────────────────── */}
                {step === 2 && (
                  <>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Location</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <Sel label="County" v={countyId} on={(v) => { setCountyId(v); setSubCountyId(""); setWardId(""); }}
                        opts={[{ v: "", l: "Select county" }, ...counties.map((c) => ({ v: c.id, l: c.name }))]} />
                      <Sel label="Sub-County" v={subCountyId} on={(v) => { setSubCountyId(v); setWardId(""); }}
                        opts={[{ v: "", l: countyId ? "Select sub-county" : "— pick county first" }, ...subCountiesForCounty.map((sc) => ({ v: sc.id, l: sc.name }))]} />
                      <Sel label="Ward" v={wardId} on={setWardId}
                        opts={[{ v: "", l: subCountyId ? "Select ward" : "— pick sub-county first" }, ...wardsForSubCounty.map((w) => ({ v: w.id, l: w.name }))]} />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <Field label="Town / Estate" v={town} on={setTown} />
                      <Field label="Visible Landmark (e.g. Near KCB, Opposite Total)" v={landmark} on={setLandmark} />
                    </div>
                    <Field label="Contact Phone" v={contactPhone} on={setContactPhone} required />
                    {listingType === "donation" && (
                      <Field label="Donation Recipient (who/where — e.g. Nyumbani Children's Home)" v={donationRecipient} on={setDonationRecipient} required />
                    )}
                  </>
                )}

                {/* ── STEP 3 ─────────────────────────────────────────── */}
                {step === 3 && (
                  <>
                    {/* Multi-Photo Uploader (Up to 8) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Photos (Up to 8) {listingType === "service" ? "(optional)" : ""}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{images.length}/8 uploaded</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {images.map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            {idx === 0 && (
                              <span className="absolute bottom-1 left-1 bg-primary text-white text-[8px] font-bold px-1 rounded">
                                Cover
                              </span>
                            )}
                          </div>
                        ))}
                        {images.length < 8 && (
                          <label className="aspect-square rounded-lg border-2 border-dashed border-border/80 flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:border-primary/50 transition">
                            <UploadCloud className="h-5 w-5 text-muted-foreground mb-1" />
                            <span className="text-[9px] font-semibold text-muted-foreground">Add photo</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              disabled={uploading}
                              onChange={(e) => handleImageUpload(e.target.files)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      {uploading && <div className="text-xs text-muted-foreground animate-pulse">Uploading photos...</div>}
                    </div>

                    {(listingType === "sale" || listingType === "hire") && (
                      <div className="pt-2 border-t border-border space-y-2.5">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Delivery</div>
                        <label className="flex items-center gap-2 text-xs">
                          <input type="checkbox" checked={offersDelivery} onChange={(e) => setOffersDelivery(e.target.checked)} />
                          I offer delivery for this {listingType === "hire" ? "hire" : "item"}
                        </label>
                        {offersDelivery && (
                          <Field label="Means of Transport / Courier (e.g. Boda Boda, Pickup, Sendy)" v={transport} on={setTransport} />
                        )}
                      </div>
                    )}

                    {listingType !== "donation" && (
                      <div className="pt-2 border-t border-border">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Modes of Payment Accepted</div>
                        <div className="flex flex-wrap gap-1.5">
                          {PAYMENT_OPTIONS.map((p) => (
                            <button type="button" key={p} onClick={() => togglePay(p)}
                              className={`text-[11px] px-2.5 py-1 rounded-full border ${payMethods.includes(p) ? "bg-primary text-white border-primary" : "bg-white border-border"}`}>{p}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Jiji Promotion Tier Selector */}
                    {listingType !== "donation" && (
                      <div className="pt-2 border-t border-border space-y-1.5">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Boost Your Ad Visibility</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: "standard", label: "Standard", extra: "+KSh 0", desc: "Regular listing", icon: null },
                            { id: "boosted", label: "Boosted", extra: "+KSh 100", desc: "Top of category", icon: Sparkles },
                            { id: "urgent", label: "Urgent", extra: "+KSh 150", desc: "Red urgent badge", icon: Flame },
                            { id: "featured", label: "Featured", extra: "+KSh 200", desc: "Homepage banner", icon: Sparkles },
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setPromotionTier(t.id as any)}
                              className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                                promotionTier === t.id
                                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                                  : "border-border hover:border-primary/40 bg-card"
                              }`}
                            >
                              <div className="text-xs font-bold flex items-center justify-between">
                                <span>{t.label}</span>
                                <span className="text-[10px] text-primary">{t.extra}</span>
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {listingType !== "donation" && (
                      <div className="pt-2 border-t border-border">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Ad settings</div>
                        <div className="grid grid-cols-3 gap-2.5">
                          <NumField label="Distance (km)" v={distance} on={setDistance} />
                          <Sel label="Risk" v={risk} on={(v) => setRisk(v as "low" | "medium" | "high")}
                            opts={[{ v: "low", l: "Low" }, { v: "medium", l: "Medium" }, { v: "high", l: "High" }]} />
                          <NumField label="Duration (days)" v={days} on={setDays} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── STEP 4 ─────────────────────────────────────────── */}
                {step === 4 && (
                  <>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Review</div>
                    <dl className="text-xs bg-muted/30 rounded-lg p-3 grid grid-cols-2 gap-y-1.5 gap-x-3">
                      <dt className="text-muted-foreground">Type</dt><dd className="font-semibold capitalize">{listingType}</dd>
                      <dt className="text-muted-foreground">Title</dt><dd className="font-semibold truncate">{title || (specialties.join(", ") || "—")}</dd>
                      {listingType !== "donation" && (<><dt className="text-muted-foreground">Price</dt><dd className="font-semibold">KSh {price.toLocaleString()}</dd></>)}
                      <dt className="text-muted-foreground">County</dt><dd className="font-semibold">{counties.find((c) => c.id === Number(countyId))?.name || "—"}</dd>
                      <dt className="text-muted-foreground">Contact</dt><dd className="font-semibold">{contactPhone || "—"}</dd>
                      {listingType === "service" && (
                        <><dt className="text-muted-foreground">Specialties</dt><dd className="font-semibold">{specialties.join(", ") || "—"}</dd></>
                      )}
                      {listingType === "donation" && (
                        <><dt className="text-muted-foreground">Recipient</dt><dd className="font-semibold">{donationRecipient || "—"}</dd></>
                      )}
                    </dl>

                    {listingType !== "donation" && (
                      <div className="flex items-center justify-between rounded-lg bg-accent/40 px-3 py-2">
                        <div className="text-xs">Estimated ad fee</div>
                        <div className="text-lg font-extrabold text-primary-dark">KSh {fee ?? "—"}</div>
                      </div>
                    )}

                    <label className="flex items-start gap-2 text-xs bg-white ring-1 ring-border rounded-lg p-3">
                      <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5" />
                      <span className="text-muted-foreground">
                        I confirm the information above is accurate, the item/service is lawful, and I accept the Vutabiz{" "}
                        <a href="#" className="text-primary underline">terms &amp; conditions</a> and community guidelines.
                      </span>
                    </label>
                  </>
                )}

                {/* Nav */}
                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                  <button type="button" onClick={back} disabled={step === 1}
                    className="inline-flex items-center gap-1 rounded-lg bg-white border border-border px-3 py-2 text-xs font-semibold disabled:opacity-40">
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <div className="text-[10px] text-muted-foreground">Step {step} of {STEP_LABELS.length}</div>
                  {step < 4 ? (
                    <button type="button" onClick={next}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary-dark hover:bg-primary text-white px-4 py-2 text-xs font-bold">
                      Next <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading || !terms}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary-dark hover:bg-primary text-white px-4 py-2 text-xs font-bold disabled:opacity-60 cursor-pointer">
                      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {listingType === "donation" ? "Post Donation" : "Submit Listing"}
                    </button>
                  )}
                </div>
              </form>
            </>
          ) : (
            <div className="mt-4 bg-card rounded-xl shadow ring-1 ring-black/5 p-5 space-y-4">
              <div className="flex items-center gap-2 text-primary-dark">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-bold">Listing saved — complete payment</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Total Ad Fee: <b className="text-primary-dark text-sm">KSh {fee}</b> (includes {promotionTier} boost)
              </p>

              {/* Option 1: Instant M-Pesa STK Push */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
                <div className="text-xs font-bold text-primary-dark flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-primary" /> Instant M-Pesa Prompt (STK Push)
                </div>
                <p className="text-[11px] text-muted-foreground">Enter your Safaricom number to receive a PIN prompt on your phone.</p>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={stkPhone}
                    onChange={(e) => setStkPhone(e.target.value)}
                    placeholder="e.g. 0712345678"
                    className="flex-1 rounded-lg border border-input bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary font-semibold"
                  />
                  <button
                    disabled={pushingStk || !stkPhone}
                    onClick={handleTriggerStk}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition disabled:opacity-60 cursor-pointer"
                  >
                    {pushingStk ? "Sending prompt..." : "Send M-Pesa Prompt"}
                  </button>
                </div>
              </div>

              {/* Option 2: Pay with Wallet */}
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Wallet className="h-4 w-4 text-primary" /> Pay with VutaBiz Wallet
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Instant activation. No transaction fees.</div>
                </div>
                <button
                  disabled={payingWithWallet}
                  onClick={handlePayWithWallet}
                  className="rounded-lg bg-primary text-white px-3 py-2 text-xs font-bold hover:bg-primary-dark transition disabled:opacity-60 cursor-pointer"
                >
                  {payingWithWallet ? "Processing..." : "Pay from Wallet"}
                </button>
              </div>

              {/* Option 3: Manual Paybill */}
              <div className="border-t border-border pt-3 space-y-2">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Or Pay Manually via Paybill</div>
                <p className="text-xs text-muted-foreground">
                  Paybill: <b>247247</b>, Account: <b>{createdId.slice(0, 8)}</b>, then enter the M-Pesa code:
                </p>
                <div className="flex gap-2">
                  <input
                    value={mpesa}
                    onChange={(e) => setMpesa(e.target.value.toUpperCase())}
                    placeholder="e.g. QK7XX8Y9ZA"
                    className="flex-1 rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary uppercase font-mono"
                  />
                  <button
                    disabled={loading || !mpesa}
                    onClick={payAd}
                    className="rounded-lg bg-primary-dark text-white px-4 py-2 text-sm font-bold disabled:opacity-60 cursor-pointer"
                  >
                    Confirm
                  </button>
                </div>
              </div>

              <Link to="/dashboard" className="inline-block text-xs text-primary underline">Skip payment for now (saved as draft)</Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, v, on, required, textarea }: { label: string; v: string; on: (v: string) => void; required?: boolean; textarea?: boolean; }) {
  return (
    <label className="block">
      <div className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{label}</div>
      {textarea ? (
        <textarea value={v} onChange={(e) => on(e.target.value)} rows={3} className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
      ) : (
        <input required={required} value={v} onChange={(e) => on(e.target.value)} className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
      )}
    </label>
  );
}

function NumField({ label, v, on, required }: { label: string; v: number; on: (v: number) => void; required?: boolean; }) {
  return (
    <label className="block">
      <div className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{label}</div>
      <input type="number" min={0} required={required} value={v} onChange={(e) => on(Number(e.target.value))} className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
    </label>
  );
}

function Sel<T extends string | number | "">({ label, v, on, opts }: { label: string; v: T; on: (v: T) => void; opts: { v: T; l: string }[]; }) {
  return (
    <label className="block">
      <div className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{label}</div>
      <select
        value={v as string | number}
        onChange={(e) => {
          const raw = e.target.value;
          const cast = typeof opts.find((o) => o.v !== "")?.v === "number" && raw !== "" ? Number(raw) : raw;
          on(cast as T);
        }}
        className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      >
        {opts.map((o) => (
          <option key={String(o.v)} value={o.v as string | number}>{o.l}</option>
        ))}
      </select>
    </label>
  );
}