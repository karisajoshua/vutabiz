import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { siteStats } from "@/lib/marketplace.functions";
import { Header, Footer } from "@/components/site-chrome";
import { CategoryMegaDropdown } from "@/components/category-mega-dropdown";
import {
  Search,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Phone,
  Users,
  Wrench,
  Package,
  HeartHandshake,
  TrendingUp,
  ShoppingBag,
  Tag,
} from "lucide-react";

import heroAppliances from "@/assets/hero-appliances.png";
import catHome from "@/assets/cat-home.jpg";
import catFurniture from "@/assets/cat-furniture.jpg";
import catConstruction from "@/assets/cat-construction.jpg";
import catFarm from "@/assets/cat-farm.jpg";
import catServices from "@/assets/cat-services.jpg";



export const Route = createFileRoute("/")({ component: Home });

const CATEGORIES_MAPPING = [
  {
    name: "Home & Living",
    slug: "home-living",
    desc: "Appliances, Kitchenware, Kitchen & Laundry, Electronics",
    img: catHome,
  },
  {
    name: "Furniture & Clothing",
    slug: "furniture-clothing",
    desc: "Sofas, Beds, Cabinets, Clothing & Fashion",
    img: catFurniture,
  },
  {
    name: "Machinery & Tools",
    slug: "machinery-tools",
    desc: "Farm Tools, Construction Materials, Spare Parts",
    img: catConstruction,
  },
  {
    name: "Animal & Farm Produce",
    slug: "animal-farm",
    desc: "Live Animals, Fresh Produce, Seeds, Fertilizer",
    img: catFarm,
  },
  {
    name: "Services",
    slug: "services-skills",
    desc: "Fundis, Technicians, Mechanics, Masons, Electricians",
    img: catServices,
  },
];


type Listing = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  status: string;
  category_id: number | null;
  town: string | null;
};

function KenteBar() {
  return (
    <div aria-hidden className="hidden md:block absolute inset-y-0 w-16 kente-pattern opacity-90" />
  );
}

const ADVERTS = [
  { t: "M-Pesa Paybill 247247", s: "Pay for ads instantly & securely", c: "from-green-600 to-emerald-800" },
  { t: "Solar Kits from KSh 4,999", s: "Power your home off-grid — verified sellers", c: "from-amber-500 to-orange-700" },
  { t: "Free ads for donations", s: "Give excess items to needy families", c: "from-rose-500 to-red-700" },
  { t: "Skilled Fundis Near You", s: "Masons, plumbers, tailors — hire locally", c: "from-blue-600 to-indigo-800" },
  { t: "Building Materials Delivered", s: "Iron sheets, cement, sand across Kenya", c: "from-stone-600 to-neutral-800" },
  { t: "List for hire — earn daily", s: "Rent out tools, machinery, PA systems", c: "from-primary to-primary-dark" },
];

function Home() {
  const navigate = useNavigate();
  const statsFn = useServerFn(siteStats);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [counties, setCounties] = useState<{ id: number; name: string }[]>([]);
  const [trending, setTrending] = useState<Listing[]>([]);
  const [stats, setStats] = useState({ users: 0, activeListings: 0, itemsSold: 0, donations: 0 });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("");

  useEffect(() => {
    supabase.from("categories").select("id,name,slug").is("parent_id", null).order("name").then(({ data }) => setCategories(data ?? []));
    supabase.from("counties").select("id,name").order("name").then(({ data }) => setCounties(data ?? []));
    supabase
      .from("listings")
      .select("id,title,price,image_url,status,category_id,town")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setTrending((data as Listing[]) ?? []));
    statsFn().then(setStats).catch(() => {});
  }, [statsFn]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/browse",
      search: {
        q: searchQuery || undefined,
        category: selectedCategory || undefined,
        county: selectedCounty ? Number(selectedCounty) : undefined,
      },
    });
  };

  const WHY = [
    {
      icon: ShieldCheck,
      title: "Local & Authentic",
      body: "Find quality items from trusted sellers in your community.",
    },
    {
      icon: Sparkles,
      title: "Safe & Secure",
      body: "Verified sellers, secure transactions and buyer protection.",
    },
    {
      icon: Phone,
      title: "Easy to Use",
      body: "Simple browsing, quick listings and seamless trading.",
    },
    {
      icon: Users,
      title: "Support Local",
      body: "Empower local businesses and grow your community.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* COMPACT TOP SEARCH & HERO PANEL */}
      <section className="relative overflow-hidden bg-primary-dark">
        <div className="relative">
          <img
            src={heroAppliances}
            alt="Kenyan home appliances and solar panels"
            className="absolute inset-0 h-full w-full object-cover opacity-25"
            width={1600}
            height={900}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/50 to-primary-dark" />
          <KenteBar />
          <div className="absolute right-0 inset-y-0 hidden md:block w-16 kente-pattern opacity-40" />

          <div className="relative mx-auto max-w-7xl px-4 md:px-12 py-5 md:py-7 text-white flex flex-col gap-3">
            <div className="max-w-3xl">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight uppercase leading-tight">
                Your Trusted Local Marketplace
              </h1>
              <p className="mt-1 text-xs md:text-sm text-white/85 max-w-2xl font-medium">
                Buy &amp; sell goods, hire equipment, and find skilled services locally across Kenya — all in one trusted marketplace.
              </p>
            </div>

            {/* Donation Hub / Buy quick actions */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                to="/sell"
                className="inline-flex items-center gap-1.5 rounded-full bg-white text-primary px-4 py-2 text-xs md:text-sm font-bold shadow hover:shadow-md transition"
              >
                <Tag className="h-3.5 w-3.5" /> Sell / Advertise
              </Link>
              <Link
                to="/browse"
                className="inline-flex items-center gap-1.5 rounded-full bg-white text-primary px-4 py-2 text-xs md:text-sm font-bold shadow hover:shadow-md transition"
              >
                <ShoppingBag className="h-3.5 w-3.5" /> Buy / Hire
              </Link>
            </div>

            {/* Inline Search Bar */}
            <form
              onSubmit={handleSearch}
              className="w-full rounded-xl bg-white shadow-md ring-1 ring-black/5 p-2"
            >
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-1.5 md:gap-0">
                {/* Search input — fills remaining space */}
                <div className="flex flex-1 items-center gap-2.5 px-3 py-1.5">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="What are you looking for?"
                    className="w-full bg-transparent outline-none text-xs md:text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {/* Category Select — compact */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 border-t md:border-t-0 md:border-l min-w-[140px]">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-transparent outline-none font-semibold cursor-pointer text-xs md:text-sm text-foreground"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Select — compact */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 border-t md:border-t-0 md:border-l min-w-[140px]">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <select
                    value={selectedCounty}
                    onChange={(e) => setSelectedCounty(e.target.value)}
                    className="w-full bg-transparent outline-none font-semibold cursor-pointer text-xs md:text-sm text-foreground"
                  >
                    <option value="">All Counties</option>
                    {counties.map((co) => (
                      <option key={co.id} value={co.id}>
                        {co.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="px-2">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white px-5 py-2.5 text-xs md:text-sm font-bold transition cursor-pointer"
                  >
                    Search <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ANIMATED ADVERT MARQUEE */}
      <section aria-label="Promotions" className="bg-primary-dark/95 border-y border-primary-dark overflow-hidden">
        <div className="relative">
          <div className="flex animate-marquee whitespace-nowrap py-2.5">
            {[...ADVERTS, ...ADVERTS].map((a, i) => (
              <div key={i} className={`mx-2 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r ${a.c} text-white px-4 py-1.5 shadow-md ring-1 ring-white/10`}>
                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                <span className="font-bold text-xs uppercase tracking-wide">{a.t}</span>
                <span className="text-[11px] text-white/85">{a.s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CATEGORIES — nested dropdown */}
      <section className="mx-auto max-w-7xl w-full px-4 pt-6 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-extrabold text-primary-dark uppercase tracking-tight">
            Browse by Category
          </h2>
          <p className="text-[11px] text-muted-foreground hidden md:block">
            Click a category → sub-category → item
          </p>
        </div>
        <CategoryMegaDropdown />
      </section>

      {/* Optional visual tiles kept for imagery */}
      <section className="mx-auto max-w-7xl w-full px-4 pb-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {CATEGORIES_MAPPING.map((c) => (
            <Link
              key={c.name}
              to="/browse"
              search={{ category: c.slug }}
              className="group overflow-hidden rounded-xl bg-card ring-1 ring-black/5 shadow-sm hover:shadow-md transition"
            >
              <div className="aspect-[16/8] overflow-hidden">
                <img
                  src={c.img}
                  alt={c.name}
                  width={800}
                  height={400}
                  loading="lazy"
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-2.5">
                <h3 className="font-bold text-foreground text-xs">{c.name}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">{c.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>


      {/* FOR HIRE & SERVICES QUICK ACCESS */}
      <section className="mx-auto max-w-7xl w-full px-4 pb-4">
        <h2 className="text-lg font-extrabold text-primary-dark uppercase tracking-tight mb-3">
          Need a Service or Hire?
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/browse"
            search={{ listing_type: "hire" }}
            className="group relative overflow-hidden rounded-xl bg-amber-50 border border-amber-200 hover:shadow-md transition p-5 flex items-center gap-4"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600 group-hover:bg-amber-500/25 transition">
              <Wrench className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-amber-800 text-base">For Hire</h3>
              <p className="text-xs text-amber-700/80 mt-0.5">Tents, generators, tools &amp; equipment</p>
              <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                Browse <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
          <Link
            to="/browse"
            search={{ listing_type: "service" }}
            className="group relative overflow-hidden rounded-xl bg-emerald-50 border border-emerald-200 hover:shadow-md transition p-5 flex items-center gap-4"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 group-hover:bg-emerald-500/25 transition">
              <Users className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-emerald-800 text-base">Services</h3>
              <p className="text-xs text-emerald-700/80 mt-0.5">Plumbing, cleaning, masonry &amp; more</p>
              <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                Browse <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* TRENDING */}
      <section className="mx-auto max-w-7xl w-full px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-primary-dark">
            Top Trending Items
          </h2>
          <Link
            to="/browse"
            className="rounded-full bg-primary text-white px-3 py-1 text-xs font-semibold hover:bg-primary-dark transition"
          >
            View All
          </Link>
        </div>

        {trending.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {trending.map((p) => (
              <article
                key={p.id}
                className="group rounded-xl bg-card ring-1 ring-black/5 overflow-hidden hover:shadow-md transition flex flex-col justify-between"
              >
                <Link to="/listing/$id" params={{ id: p.id }} className="block">
                  <div className="aspect-square p-2 bg-muted/20">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.title}
                        width={600}
                        height={600}
                        loading="lazy"
                        className="h-full w-full object-cover rounded-lg group-hover:scale-103 transition"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground rounded-lg">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="px-2 pb-1.5 pt-0.5">
                    <h3 className="text-xs font-bold text-foreground line-clamp-2 min-h-[32px]">
                      {p.title}
                    </h3>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{p.town}</div>
                    <div className="text-primary font-bold mt-0.5 text-xs md:text-sm">
                      KSh {Number(p.price).toLocaleString()}
                    </div>
                  </div>
                </Link>
                <div className="px-2 pb-2">
                  <Link
                    to="/listing/$id"
                    params={{ id: p.id }}
                    className="mt-1 w-full inline-flex items-center justify-center rounded-lg bg-primary-dark text-white py-1.5 text-xs font-semibold hover:bg-primary transition"
                  >
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-card rounded-xl ring-1 ring-black/5">
            <p className="text-muted-foreground text-xs">
              No active listings yet. Be the first to post!
            </p>
            <Link
              to="/sell"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary text-white px-4 py-2 text-xs font-semibold shadow hover:bg-primary-dark transition"
            >
              Post an Ad
            </Link>
          </div>
        )}
      </section>

      {/* STATS */}
      <section className="bg-gradient-to-br from-primary-dark to-primary text-white py-8">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center text-lg font-extrabold uppercase tracking-tight">Trusted Across Kenya</h2>
          <p className="mt-1 text-center text-xs text-white/80">Real numbers, real impact — updated live</p>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Users, label: "Kenyans Served", value: stats.users },
              { icon: Package, label: "Active Listings", value: stats.activeListings },
              { icon: TrendingUp, label: "Items Sold", value: stats.itemsSold },
              { icon: HeartHandshake, label: "Donations Posted", value: stats.donations },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/15 p-4 text-center">
                <s.icon className="h-5 w-5 mx-auto mb-1.5 text-accent" />
                <div className="text-2xl md:text-3xl font-extrabold">{s.value.toLocaleString()}+</div>
                <div className="text-[10px] uppercase tracking-wider text-white/85 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE */}

      <section className="mx-auto max-w-7xl w-full px-4 py-8">
        <h2 className="text-center text-lg font-extrabold uppercase text-primary-dark tracking-tight">
          Why Choose Sokonyumbani?
        </h2>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {WHY.map((w) => (
            <div key={w.title} className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                <w.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-foreground text-sm">{w.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{w.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
