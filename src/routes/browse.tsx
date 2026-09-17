import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useRef } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Header, Footer } from "@/components/site-chrome";
import { STATIC_SUB_COUNTIES } from "@/lib/location-data";
import { saveSearchQuery } from "@/lib/marketplace.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Tag,
  Coins,
  Check,
  X,
  ShoppingBag,
  Wrench,
  Users,
  Bookmark,
  Sparkles,
  Flame,
  Camera,
  Grid,
  Map,
  ArrowUpDown,
  Bell,
  Eye,
} from "lucide-react";

// Define the search validator schema using zod
const searchSchema = z.object({
  q: z.string().optional().catch(""),
  category: z.string().optional().catch(""),
  county: z.number().optional().catch(undefined),
  sub_county: z.number().optional().catch(undefined),
  subcounty: z.number().optional().catch(undefined),
  ward: z.number().optional().catch(undefined),
  listing_type: z.enum(["sale", "hire", "service", "donation"]).optional().catch(undefined),
  type: z.string().optional().catch(""),
  minPrice: z.number().optional().catch(undefined),
  maxPrice: z.number().optional().catch(undefined),
  sort: z.enum(["newest", "price_asc", "price_desc", "distance"]).optional().catch("newest"),
  view: z.enum(["grid", "explorer"]).optional().catch("grid"),
});


export const Route = createFileRoute("/browse")({
  validateSearch: searchSchema,
  component: Browse,
  head: () => ({
    meta: [
      { title: "Browse Marketplace – Sokonyumbani" },
      {
        name: "description",
        content: "Browse home appliances, building materials, vehicles, and services for sale across Kenya.",
      },
    ],
  }),
});

type ListingRow = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  images?: string[] | null;
  specs?: Record<string, any> | null;
  promotion_tier?: string | null;
  views_count?: number | null;
  distance_km?: number | null;
  town: string | null;
  county_id: number | null;
  listing_type: "sale" | "hire" | "service" | "donation" | null;
  work_rate_type: string | null;
  created_at: string;
};

type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
};

type County = {
  id: number;
  name: string;
};

type SubCounty = {
  id: number;
  county_id: number;
  name: string;
};

type Ward = { id: number; county_id: number; sub_county_id: number | null; name: string };

const LISTING_TYPE_LABELS: Record<string, { label: string; icon: typeof ShoppingBag; color: string }> = {
  sale: { label: "For Sale", icon: ShoppingBag, color: "bg-primary/10 text-primary-dark" },
  hire: { label: "For Hire", icon: Wrench, color: "bg-amber-500/10 text-amber-700" },
  service: { label: "Service", icon: Users, color: "bg-emerald-500/10 text-emerald-700" },
  donation: { label: "Donation", icon: ShoppingBag, color: "bg-rose-500/10 text-rose-700" },
};

const PRICE_TYPE_SUFFIX: Record<string, string> = {
  hourly: "/hr",
  weekly: "/wk",
  monthly: "/mo",
  agreed: " (agreed)",
};

/** Every descendant category id under `rootId`, at any depth (group → sub-category → item/specialty). */
function collectDescendantIds(rootId: number, all: Category[]): number[] {
  const result: number[] = [];
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift() as number;
    for (const kid of all.filter((c) => c.parent_id === id)) {
      result.push(kid.id);
      queue.push(kid.id);
    }
  }
  return result;
}

type PrevSearch = {
  q?: string; category?: string; type?: string; listing_type?: "sale" | "hire" | "service" | "donation";
  county?: number; sub_county?: number; subcounty?: number; ward?: number;
  minPrice?: number; maxPrice?: number; sort?: "newest" | "price_asc" | "price_desc" | "distance";
  view?: "grid" | "explorer";
};

const POPULAR_SEARCH_SUGGESTIONS = [
  "Toyota Probox",
  "iPhone 13",
  "Sufuria Set",
  "Water Tank 1000L",
  "Plumbing Services",
  "Smart TV 43 inch",
  "Cement 50kg",
  "Bedsitter",
  "Electrician",
  "Solar Panel 300W",
  "Motorcycle Boxer",
  "Fridge Samsung",
];

function Browse() {
  const { q, category, county, sub_county, subcounty, ward, listing_type, type, minPrice, maxPrice, sort, view } = Route.useSearch();
  const navigate = useNavigate();
  const doSaveSearch = useServerFn(saveSearchQuery);

  const [items, setItems] = useState<ListingRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [subCounties, setSubCounties] = useState<SubCounty[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [browseMode, setBrowseMode] = useState<"category" | "location">("category");

  // Filter input states
  const [searchVal, setSearchVal] = useState(q || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [minPriceVal, setMinPriceVal] = useState(minPrice !== undefined ? String(minPrice) : "");
  const [maxPriceVal, setMaxPriceVal] = useState(maxPrice !== undefined ? String(maxPrice) : "");
  const [selectedCounty, setSelectedCounty] = useState<string>(
    county !== undefined ? String(county) : "",
  );
  const [selectedSubCounty, setSelectedSubCounty] = useState<string>(
    sub_county !== undefined ? String(sub_county) : "",
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [savingSearch, setSavingSearch] = useState(false);

  // Fetch static categories, counties and sub_counties once
  useEffect(() => {
    supabase
      .from("categories")
      .select("id,name,slug,parent_id")
      .order("name")
      .then(({ data }) => {
        setCategories((data as Category[]) ?? []);
      });
    supabase
      .from("counties")
      .select("id,name")
      .order("name")
      .then(({ data }) => {
        setCounties((data as County[]) ?? []);
      });
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
    supabase
      .from("wards")
      .select("id,county_id,sub_county_id:subcounty_id,name")
      .order("name")
      .then(({ data }) => {
        const rows = (data as any[]) ?? [];
        const normalized = rows.map((r) => ({
          id: r.id,
          county_id: r.county_id,
          sub_county_id: r.sub_county_id ?? r.subcounty_id ?? null,
          name: r.name,
        })) as Ward[];
        setWards(normalized);
      });
  }, []);

  // Sync state with URL updates
  useEffect(() => {
    setSearchVal(q || "");
    setMinPriceVal(minPrice !== undefined ? String(minPrice) : "");
    setMaxPriceVal(maxPrice !== undefined ? String(maxPrice) : "");
    setSelectedCounty(county !== undefined ? String(county) : "");
    setSelectedSubCounty(sub_county !== undefined ? String(sub_county) : "");
  }, [q, category, county, sub_county, subcounty, ward, listing_type, type, minPrice, maxPrice, sort, view]);

  // Main search query execution
  useEffect(() => {
    setLoading(true);
    const handler = setTimeout(async () => {
      try {
        let query = supabase
          .from("listings")
          .select("id,title,price,image_url,images,specs,promotion_tier,views_count,distance_km,town,county_id,listing_type,work_rate_type,landmark,donation_recipient,created_at")
          .eq("status", "active");

        if (q) {
          query = query.ilike("title", `%${q}%`);
        }

        if (county) query = query.eq("county_id", county);
        if (sub_county) query = query.eq("subcounty_id", sub_county);
        if (subcounty) query = query.eq("subcounty_id", subcounty);
        if (ward) query = query.eq("ward_id", ward);

        const activeType = type || listing_type;
        if (activeType) {
          query = query.eq("listing_type", activeType as "sale" | "hire" | "service" | "donation");
        }

        if (minPrice !== undefined) {
          query = query.gte("price", minPrice);
        }

        if (maxPrice !== undefined) {
          query = query.lte("price", maxPrice);
        }

        if (category) {
          const cat = categories.find((c) => c.slug === category);
          if (cat) {
            const allIds = [cat.id, ...collectDescendantIds(cat.id, categories)];
            query = query.in("category_id", allIds);
          } else {
            const { data: dbCat } = await supabase
              .from("categories")
              .select("id,parent_id")
              .eq("slug", category)
              .maybeSingle();
            if (dbCat) {
              const { data: level2 } = await supabase.from("categories").select("id").eq("parent_id", dbCat.id);
              const level2Ids = (level2 ?? []).map((c) => c.id);
              let level3Ids: number[] = [];
              if (level2Ids.length > 0) {
                const { data: level3 } = await supabase.from("categories").select("id").in("parent_id", level2Ids);
                level3Ids = (level3 ?? []).map((c) => c.id);
              }
              query = query.in("category_id", [dbCat.id, ...level2Ids, ...level3Ids]);
            }
          }
        }

        // Apply sort
        if (sort === "price_asc") {
          query = query.order("price", { ascending: true });
        } else if (sort === "price_desc") {
          query = query.order("price", { ascending: false });
        } else if (sort === "distance") {
          query = query.order("distance_km", { ascending: true });
        } else {
          query = query.order("created_at", { ascending: false });
        }

        const { data } = await query.limit(80);
        const rows = (data as ListingRow[]) ?? [];

        // Priority sort: Promoted items (featured, urgent) ranked to the top
        const prioritized = [...rows].sort((a, b) => {
          const tierRank = (t?: string | null) => (t === "featured" ? 3 : t === "urgent" ? 2 : t === "boosted" ? 1 : 0);
          return tierRank(b.promotion_tier) - tierRank(a.promotion_tier);
        });

        setItems(prioritized);
      } catch (err) {
        console.error("Error fetching listings:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(handler);
  }, [q, category, county, sub_county, subcounty, ward, listing_type, type, minPrice, maxPrice, categories]);

  // Construct Category tree (Group -> Sub-category -> Item/Specialty)
  const categoryTree = useMemo(() => {
    const parents = categories.filter((c) => c.parent_id === null);
    return parents.map((parent) => ({
      ...parent,
      children: categories
        .filter((c) => c.parent_id === parent.id)
        .map((child) => ({
          ...child,
          items: categories.filter((c) => c.parent_id === child.id),
        })),
    }));
  }, [categories]);

  // Category browsing must stay in sync with the active listing type — the
  // same way "For Sale"/"For Hire" only make sense against item categories,
  // "Services" should only surface the Services & Skills category tree
  // instead of irrelevant item categories (Home & Living, Furniture, etc.).
  const activeTypeForCats = type || listing_type;
  const visibleCategoryTree = useMemo(() => {
    if (activeTypeForCats === "service") {
      return categoryTree.filter((g) => g.slug === "services-skills");
    }
    if (activeTypeForCats === "sale" || activeTypeForCats === "hire" || activeTypeForCats === "donation") {
      return categoryTree.filter((g) => g.slug !== "services-skills");
    }
    return categoryTree; // no type filter active — show every category
  }, [categoryTree, activeTypeForCats]);
  const visibleCategories = useMemo(
    () => visibleCategoryTree.flatMap((g) => [g, ...g.children.flatMap((c) => [c, ...c.items])]),
    [visibleCategoryTree],
  );

  // Sub-counties filtered by selected county
  const subCountiesForCounty = useMemo(
    () => subCounties.filter((sc) => sc.county_id === Number(selectedCounty)),
    [subCounties, selectedCounty],
  );

  // Apply filters function
  const applyFilters = (updates: {
    q?: string;
    category?: string;
    county?: number;
    sub_county?: number;
    listing_type?: "sale" | "hire" | "service" | "donation";
    minPrice?: number;
    maxPrice?: number;
  }) => {
    navigate({
      to: "/browse",
      search: {
        q: updates.q !== undefined ? updates.q || undefined : q || undefined,
        category:
          updates.category !== undefined ? updates.category || undefined : category || undefined,
        county: updates.county !== undefined ? updates.county || undefined : county || undefined,
        sub_county:
          updates.sub_county !== undefined
            ? updates.sub_county || undefined
            : sub_county || undefined,
        listing_type:
          updates.listing_type !== undefined ? updates.listing_type : listing_type || undefined,
        minPrice:
          updates.minPrice !== undefined
            ? updates.minPrice !== -1
              ? updates.minPrice
              : undefined
            : minPrice || undefined,
        maxPrice:
          updates.maxPrice !== undefined
            ? updates.maxPrice !== -1
              ? updates.maxPrice
              : undefined
            : maxPrice || undefined,
      },
    });
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({
      minPrice: minPriceVal ? Number(minPriceVal) : -1,
      maxPrice: maxPriceVal ? Number(maxPriceVal) : -1,
    });
  };

  const handleClearFilters = () => {
    setSearchVal("");
    setMinPriceVal("");
    setMaxPriceVal("");
    setSelectedCounty("");
    setSelectedSubCounty("");
    navigate({
      to: "/browse",
      search: {},
    });
  };

  // Find names of active filters for chips
  const activeCountyName = counties.find((co) => co.id === county)?.name;
  const activeSubCountyName = subCounties.find((sc) => sc.id === sub_county)?.name;
  const activeCategoryName = categories.find((c) => c.slug === category)?.name;
  const activeType = type || listing_type;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="leading-tight">
            <h1 className="text-xl font-extrabold text-primary-dark tracking-tight">
              Marketplace
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Find amazing items & services across Kenya</p>
          </div>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="md:hidden flex items-center gap-1.5 rounded-lg bg-primary text-white px-3 py-2 text-xs font-semibold shadow hover:bg-primary-dark transition cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          </button>
        </div>

        {/* Search header bar */}
        <div className="mb-4 relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchVal}
            onChange={(e) => { setSearchVal(e.target.value); setShowSuggestions(e.target.value.length > 0); }}
            onFocus={() => setShowSuggestions(searchVal.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { setShowSuggestions(false); applyFilters({ q: searchVal }); }
              if (e.key === "Escape") setShowSuggestions(false);
            }}
            placeholder="Search solar panels, fridges, plumbing, TVs..."
            className="w-full rounded-xl border border-border/70 bg-card pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary shadow-sm text-xs md:text-sm"
          />
          {showSuggestions && (
            <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden">
              {POPULAR_SEARCH_SUGGESTIONS.filter(s => s.toLowerCase().includes(searchVal.toLowerCase())).slice(0, 6).map(s => (
                <button key={s} onMouseDown={() => { setSearchVal(s); setShowSuggestions(false); applyFilters({ q: s }); }}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-muted flex items-center gap-2">
                  <Search className="h-3 w-3 text-muted-foreground" />{s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Type tabs */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {[
            { v: "", l: "All" },
            { v: "sale", l: "For Sale" },
            { v: "hire", l: "For Hire" },
            { v: "service", l: "Services" },
            { v: "donation", l: "Donations" },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => navigate({ to: "/browse", search: (prev: PrevSearch) => ({ ...prev, listing_type: (t.v as "sale" | "hire" | "service" | "donation") || undefined, type: undefined, category: undefined }) })}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition ${(activeType || "") === t.v ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary/50"}`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* Browse mode toggle */}
        <div className="mb-3 inline-flex rounded-lg bg-muted p-0.5 text-xs font-semibold">
          <button onClick={() => setBrowseMode("category")} className={`px-3 py-1.5 rounded-md ${browseMode === "category" ? "bg-white shadow" : "text-muted-foreground"}`}>By Category</button>
          <button onClick={() => setBrowseMode("location")} className={`px-3 py-1.5 rounded-md ${browseMode === "location" ? "bg-white shadow" : "text-muted-foreground"}`}>By Location</button>
        </div>

        {browseMode === "location" && (
          <LocationDrilldown
            counties={counties}
            subcounties={subCounties}
            wards={wards}
            county={county}
            subcounty={subcounty ?? sub_county}
            ward={ward}
            onPick={(patch) => navigate({ to: "/browse", search: (prev: PrevSearch) => ({ ...prev, ...patch }) })}
          />
        )}

        {/* Sort + Save Search toolbar */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-xs">
            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
            <select
              value={sort || "newest"}
              onChange={(e) => navigate({ to: "/browse", search: (prev: PrevSearch) => ({ ...prev, sort: e.target.value as any }) })}
              className="bg-transparent outline-none text-xs font-semibold cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="distance">Nearest First</option>
            </select>
          </div>
          <button
            onClick={() => setSaveModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary transition"
          >
            <Bookmark className="h-3 w-3" /> Save Search
          </button>
          {items.length > 0 && !loading && (
            <span className="text-[11px] text-muted-foreground ml-auto">{items.length} results</span>
          )}
        </div>

        {/* Save Search Modal */}
        {saveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setSaveModalOpen(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-bold mb-1">Save this Search</h3>
              <p className="text-xs text-muted-foreground mb-4">Give this search a name so you can quickly find it later in your dashboard.</p>
              <input
                autoFocus
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={async e => { if (e.key === "Enter") { /* save */ } }}
                placeholder={q ? `"${q}"` : "My saved search"}
                className="w-full rounded-xl border border-border/70 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary mb-4"
              />
              <div className="flex gap-2">
                <button onClick={() => setSaveModalOpen(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition">Cancel</button>
                <button
                  disabled={savingSearch}
                  onClick={async () => {
                    setSavingSearch(true);
                    try {
                      await doSaveSearch({ data: { name: saveName || (q ? `"${q}"` : "Saved search"), query_params: { q, category, county, sub_county, listing_type, minPrice, maxPrice, sort } } });
                      toast.success("Search saved! Find it in Dashboard → Saved Searches.");
                      setSaveModalOpen(false); setSaveName("");
                    } catch { toast.error("Sign in to save searches."); }
                    finally { setSavingSearch(false); }
                  }}
                  className="flex-1 rounded-xl bg-primary text-white py-2.5 text-sm font-bold hover:bg-primary-dark transition disabled:opacity-60"
                >
                  {savingSearch ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter chips */}
        {(q ||
          category ||
          county ||
          sub_county ||
          listing_type ||
          type ||
          minPrice !== undefined ||
          maxPrice !== undefined) && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Active Filters:
            </span>
            {q && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/10 text-primary-dark px-2.5 py-1 rounded-full">
                "{q}"{" "}
                <X className="h-3 w-3 cursor-pointer" onClick={() => applyFilters({ q: "" })} />
              </span>
            )}
            {activeType && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/10 text-primary-dark px-2.5 py-1 rounded-full">
                {LISTING_TYPE_LABELS[activeType]?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    navigate({
                      to: "/browse",
                      search: { q: q || undefined, category: category || undefined, county: county || undefined },
                    })
                  }
                />
              </span>
            )}
            {activeCategoryName && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/10 text-primary-dark px-2.5 py-1 rounded-full">
                Category: {activeCategoryName}{" "}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => applyFilters({ category: "" })}
                />
              </span>
            )}
            {activeCountyName && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/10 text-primary-dark px-2.5 py-1 rounded-full">
                {activeCountyName}{" "}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    navigate({
                      to: "/browse",
                      search: {
                        q: q || undefined,
                        category: category || undefined,
                        listing_type: listing_type || undefined,
                        minPrice: minPrice || undefined,
                        maxPrice: maxPrice || undefined,
                      },
                    })
                  }
                />
              </span>
            )}
            {activeSubCountyName && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/10 text-primary-dark px-2.5 py-1 rounded-full">
                {activeSubCountyName}{" "}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    applyFilters({ sub_county: undefined })
                  }
                />
              </span>
            )}
            {(minPrice !== undefined || maxPrice !== undefined) && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/10 text-primary-dark px-2.5 py-1 rounded-full">
                Price: KSh {minPrice?.toLocaleString() || "0"} -{" "}
                {maxPrice?.toLocaleString() || "Max"}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => applyFilters({ minPrice: -1, maxPrice: -1 })}
                />
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="text-[11px] font-bold text-destructive hover:underline ml-1.5"
            >
              Clear All
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-[230px_1fr] gap-6">
          {/* DESKTOP SIDEBAR FILTERS */}
          <aside className="hidden md:block space-y-4">
            {/* Category Filter */}
            <div className="bg-card rounded-xl ring-1 ring-black/5 shadow-sm p-4 border border-border/40">
              <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary" /> Categories
              </h3>
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                <button
                  onClick={() => applyFilters({ category: "" })}
                  className={`w-full text-left text-xs font-bold flex justify-between items-center ${!category ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <span>All Categories</span>
                  {!category && <Check className="h-3.5 w-3.5" />}
                </button>
                <div className="border-t border-border/50 my-1.5" />
                {visibleCategoryTree.map((parent) => {
                  const isParentActive = category === parent.slug;
                  return (
                    <div key={parent.id} className="space-y-1">
                      <button
                        onClick={() => applyFilters({ category: parent.slug })}
                        className={`w-full text-left text-xs font-bold flex justify-between items-center ${isParentActive ? "text-primary" : "text-foreground/90 hover:text-primary"}`}
                      >
                        <span>{parent.name}</span>
                      </button>
                      {parent.children.length > 0 && (
                        <div className="pl-2.5 border-l border-border/80 ml-1 mt-0.5 space-y-0.5">
                          {parent.children.map((child) => {
                            const isChildActive =
                              category === child.slug || child.items.some((i) => i.slug === category);
                            return (
                              <div key={child.id}>
                                <button
                                  onClick={() => applyFilters({ category: child.slug })}
                                  className={`w-full text-left text-[11px] font-semibold py-0.5 block transition ${isChildActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                  {child.name}
                                </button>
                                {isChildActive && child.items.length > 0 && (
                                  <div className="pl-2.5 border-l border-border/60 ml-1 mt-0.5 space-y-0.5">
                                    {child.items.map((item) => {
                                      const isItemActive = category === item.slug;
                                      return (
                                        <button
                                          key={item.id}
                                          onClick={() => applyFilters({ category: item.slug })}
                                          className={`w-full text-left text-[10.5px] py-0.5 block transition ${isItemActive ? "text-primary font-bold" : "text-muted-foreground/80 hover:text-foreground"}`}
                                        >
                                          {item.name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Location Filter: County → Sub-County */}
            <div className="bg-card rounded-xl ring-1 ring-black/5 shadow-sm p-4 border border-border/40">
              <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Location
              </h3>
              <div className="space-y-2">
                <select
                  value={selectedCounty}
                  onChange={(e) => {
                    setSelectedCounty(e.target.value);
                    setSelectedSubCounty("");
                    applyFilters({
                      county: e.target.value ? Number(e.target.value) : undefined,
                      sub_county: undefined,
                    });
                  }}
                  className="w-full rounded-lg border border-input bg-white px-2.5 py-2 outline-none focus:ring-2 focus:ring-primary text-xs cursor-pointer"
                >
                  <option value="">All Counties</option>
                  {counties.map((co) => (
                    <option key={co.id} value={co.id}>
                      {co.name}
                    </option>
                  ))}
                </select>

                {selectedCounty && subCountiesForCounty.length > 0 && (
                  <select
                    value={selectedSubCounty}
                    onChange={(e) => {
                      setSelectedSubCounty(e.target.value);
                      applyFilters({
                        sub_county: e.target.value ? Number(e.target.value) : undefined,
                      });
                    }}
                    className="w-full rounded-lg border border-input bg-white px-2.5 py-2 outline-none focus:ring-2 focus:ring-primary text-xs cursor-pointer"
                  >
                    <option value="">All Sub-Counties</option>
                    {subCountiesForCounty.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Price Filter */}
            <div className="bg-card rounded-xl ring-1 ring-black/5 shadow-sm p-4 border border-border/40">
              <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-primary" /> Price Range (KSh)
              </h3>
              <form onSubmit={handlePriceApply} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPriceVal}
                    onChange={(e) => setMinPriceVal(e.target.value)}
                    className="w-full rounded-lg border border-input bg-white px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPriceVal}
                    onChange={(e) => setMaxPriceVal(e.target.value)}
                    className="w-full rounded-lg border border-input bg-white px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-primary text-white py-1.5 text-xs font-bold hover:bg-primary-dark transition cursor-pointer"
                >
                  Apply Price
                </button>
              </form>
            </div>
          </aside>

          {/* MAIN LISTINGS PANEL */}
          <div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-xl overflow-hidden bg-card border border-border/40 shadow-sm p-3 space-y-2.5"
                  >
                    <div className="aspect-[16/10] bg-muted rounded-lg w-full" />
                    <div className="h-3.5 bg-muted rounded w-2/3" />
                    <div className="h-2.5 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : items.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 animate-in fade-in duration-300">
                {items.map((it) => {
                  const typeInfo = it.listing_type ? LISTING_TYPE_LABELS[it.listing_type] : null;
                  const priceSuffix =
                    it.work_rate_type
                      ? PRICE_TYPE_SUFFIX[it.work_rate_type] ?? ""
                      : "";
                  return (
                    <Link
                      key={it.id}
                      to="/listing/$id"
                      params={{ id: it.id }}
                      className="group rounded-xl overflow-hidden bg-card border border-border/40 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-[16/10] bg-muted/20 overflow-hidden relative">
                          {it.image_url ? (
                            <img
                              src={it.image_url}
                              alt={it.title}
                              className="w-full h-full object-cover group-hover:scale-102 transition-all duration-500"
                            />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-muted-foreground text-[10px]">
                              No image
                            </div>
                          )}
                          {/* Listing type badge */}
                          {typeInfo && it.listing_type !== "sale" && (
                            <span
                              className={`absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${typeInfo.color}`}
                            >
                              <typeInfo.icon className="h-2.5 w-2.5" />
                              {typeInfo.label}
                            </span>
                          )}
                          {/* Promoted badge */}
                          {it.promotion_tier === "featured" && (
                            <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500 text-white shadow-sm">
                              <Sparkles className="h-2.5 w-2.5" /> FEATURED
                            </span>
                          )}
                          {it.promotion_tier === "urgent" && (
                            <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-600 text-white shadow-sm">
                              <Flame className="h-2.5 w-2.5" /> URGENT
                            </span>
                          )}
                          {/* Multi-photo badge */}
                          {Array.isArray(it.images) && it.images.length > 1 && (
                            <span className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5">
                              <Camera className="h-2.5 w-2.5" /> {it.images.length}
                            </span>
                          )}
                          <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[9px] flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" /> {it.town}
                          </div>
                        </div>
                        <div className="p-2.5">
                          <div className="text-xs font-bold text-foreground line-clamp-2 min-h-[32px] leading-tight group-hover:text-primary transition-colors">
                            {it.title}
                          </div>
                        </div>
                      </div>
                      <div className="px-2.5 pb-2.5 pt-0 flex items-center justify-between border-t border-border/40 mt-0.5">
                        <div className="text-primary-dark font-extrabold text-xs md:text-sm">
                          {it.listing_type === "donation" ? "Free" : `KSh ${Number(it.price).toLocaleString()}`}
                          {priceSuffix && (
                            <span className="text-[10px] font-semibold text-muted-foreground ml-0.5">
                              {priceSuffix}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                          {it.views_count !== undefined && it.views_count !== null && it.views_count > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Eye className="h-2.5 w-2.5" /> {it.views_count}
                            </span>
                          )}
                          <span>
                            {new Date(it.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-card rounded-xl border border-border/40 shadow-sm">
                <p className="text-muted-foreground text-xs font-semibold">
                  No active listings match your filters.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="mt-3 rounded-lg bg-primary text-white px-4 py-2 text-xs font-semibold shadow hover:bg-primary-dark transition cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MOBILE FILTERS SHEET */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          {/* Overlay */}
          <div
            onClick={() => setShowMobileFilters(false)}
            className="absolute inset-0 bg-black/50"
          />
          {/* Drawer Content */}
          <div className="relative w-full max-w-sm bg-background h-full overflow-y-auto p-6 shadow-xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" /> Filter Options
                </h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-1 rounded-full hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Listing Type */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Listing Type
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {(["sale", "hire", "service", "donation"] as const).map((t) => {
                    const info = LISTING_TYPE_LABELS[t];
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          applyFilters({ listing_type: t, category: "" });
                          setShowMobileFilters(false);
                        }}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition cursor-pointer ${
                          (activeType) === t
                            ? "border-primary bg-primary/10 text-primary-dark"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        <info.icon className="h-3.5 w-3.5" />
                        {info.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Category Select */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Categories
                </h3>
                <select
                  value={category || ""}
                  onChange={(e) => applyFilters({ category: e.target.value || undefined })}
                  className="w-full rounded-lg border border-input bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">All Categories</option>
                  {visibleCategories.map((c) => {
                    const parent = c.parent_id ? categories.find((p) => p.id === c.parent_id) : undefined;
                    const depth = c.parent_id ? (parent?.parent_id ? 2 : 1) : 0;
                    return (
                      <option key={c.id} value={c.slug}>
                        {depth > 0 ? `${"— ".repeat(depth)}${c.name}` : c.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Mobile Location Select */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Location
                </h3>
                <select
                  value={selectedCounty}
                  onChange={(e) => {
                    setSelectedCounty(e.target.value);
                    setSelectedSubCounty("");
                    applyFilters({
                      county: e.target.value ? Number(e.target.value) : undefined,
                      sub_county: undefined,
                    });
                  }}
                  className="w-full rounded-lg border border-input bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">All Counties</option>
                  {counties.map((co) => (
                    <option key={co.id} value={co.id}>
                      {co.name}
                    </option>
                  ))}
                </select>
                {selectedCounty && subCountiesForCounty.length > 0 && (
                  <select
                    value={selectedSubCounty}
                    onChange={(e) => {
                      setSelectedSubCounty(e.target.value);
                      applyFilters({
                        sub_county: e.target.value ? Number(e.target.value) : undefined,
                      });
                    }}
                    className="w-full rounded-lg border border-input bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">All Sub-Counties</option>
                    {subCountiesForCounty.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Mobile Price Select */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Price Range (KSh)
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setShowMobileFilters(false);
                    handlePriceApply(e);
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPriceVal}
                      onChange={(e) => setMinPriceVal(e.target.value)}
                      className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPriceVal}
                      onChange={(e) => setMaxPriceVal(e.target.value)}
                      className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-primary text-white py-2.5 text-sm font-bold hover:bg-primary-dark transition cursor-pointer"
                  >
                    Apply Price Range
                  </button>
                </form>
              </div>
            </div>

            <div className="pt-6 border-t border-border mt-8 flex gap-2">
              <button
                onClick={() => {
                  handleClearFilters();
                  setShowMobileFilters(false);
                }}
                className="flex-1 rounded-xl bg-muted py-3 text-sm font-bold text-center"
              >
                Reset All
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 rounded-xl bg-primary text-white py-3 text-sm font-bold text-center cursor-pointer"
              >
                View Results
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

type LocPatch = { county?: number; subcounty?: number; ward?: number };

function LocationDrilldown({
  counties, subcounties, wards, county, subcounty, ward, onPick,
}: {
  counties: County[];
  subcounties: SubCounty[];
  wards: Ward[];
  county?: number;
  subcounty?: number;
  ward?: number;
  onPick: (patch: LocPatch) => void;
}) {
  return (
    <div className="mb-4 bg-card rounded-xl ring-1 ring-black/5 p-3">
      <div className="text-xs font-bold text-primary-dark mb-2 flex items-center gap-2">
        <MapPin className="h-3.5 w-3.5" /> Drill down by location
      </div>
      {!county ? (
        <div className="flex flex-wrap gap-1.5">
          {counties.map((c) => (
            <button key={c.id} onClick={() => onPick({ county: c.id, subcounty: undefined, ward: undefined })} className="text-xs px-2.5 py-1 rounded-full bg-white border border-border hover:border-primary hover:text-primary">
              {c.name}
            </button>
          ))}
        </div>
      ) : !subcounty ? (
        <>
          <button onClick={() => onPick({ county: undefined, subcounty: undefined, ward: undefined })} className="text-[11px] text-muted-foreground mb-2">← All counties</button>
          <div className="text-xs font-semibold mb-1.5">{counties.find((c) => c.id === county)?.name} — pick a subcounty</div>
          <div className="flex flex-wrap gap-1.5">
            {subcounties.filter((s) => s.county_id === county).map((s) => (
              <button key={s.id} onClick={() => onPick({ subcounty: s.id, ward: undefined })} className="text-xs px-2.5 py-1 rounded-full bg-white border border-border hover:border-primary hover:text-primary">
                {s.name}
              </button>
            ))}
          </div>
        </>
      ) : !ward ? (
        <>
          <button onClick={() => onPick({ subcounty: undefined, ward: undefined })} className="text-[11px] text-muted-foreground mb-2">← Change subcounty</button>
          <div className="text-xs font-semibold mb-1.5">Pick a ward</div>
          <div className="flex flex-wrap gap-1.5">
            {wards
              .filter((w) => w.sub_county_id === subcounty)
              .filter((w) => {
                // Some historical seed data created a placeholder "ward" whose
                // name just duplicates its parent sub-county's name — hide
                // those so only genuine wards show up here.
                const scName = subcounties.find((s) => s.id === subcounty)?.name;
                return !scName || w.name.trim().toLowerCase() !== scName.trim().toLowerCase();
              })
              .map((w) => (
              <button key={w.id} onClick={() => onPick({ ward: w.id })} className="text-xs px-2.5 py-1 rounded-full bg-white border border-border hover:border-primary hover:text-primary">
                {w.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold">Filtered:</span>
          <span>{wards.find((w) => w.id === ward)?.name}</span>
          <button onClick={() => onPick({ county: undefined, subcounty: undefined, ward: undefined })} className="text-primary underline">clear</button>
        </div>
      )}
    </div>
  );
}