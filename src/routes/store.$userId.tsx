import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header, Footer } from "@/components/site-chrome";
import { toggleFollowSeller, getSellerFollowersCount } from "@/lib/marketplace.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MapPin, UserPlus, UserCheck, Share2, Users } from "lucide-react";

export const Route = createFileRoute("/store/$userId")({
  component: StorePage,
  head: ({ params }) => ({
    meta: [
      { title: `Sokonyumbani Store · ${params.userId.slice(0, 8)}` },
      { name: "description", content: "Shop directly from this Sokonyumbani seller." },
      { property: "og:title", content: "Sokonyumbani Seller Store" },
      { property: "og:description", content: "Buy locally on Sokonyumbani — Kenya's marketplace." },
    ],
  }),
});

type Profile = { full_name: string; town: string | null; county_id: number | null };
type Row = { id: string; title: string; price: number; image_url: string | null; status: string };

function StorePage() {
  const { userId } = Route.useParams();
  const doToggleFollow = useServerFn(toggleFollowSeller);
  const doGetFollowers = useServerFn(getSellerFollowersCount);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setMe(data.user?.id ?? null);
      if (data.user) {
        supabase
          .from("follows")
          .select("id")
          .eq("follower_id", data.user.id)
          .eq("seller_id", userId)
          .maybeSingle()
          .then(({ data: fol }) => setIsFollowing(!!fol));
      }
    });

    doGetFollowers({ data: { seller_id: userId } })
      .then((res) => setFollowersCount(res.count))
      .catch(() => {});

    supabase
      .from("profiles")
      .select("full_name,town,county_id")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => setProfile(data as Profile | null));
    supabase
      .from("listings")
      .select("id,title,price,image_url,status")
      .eq("seller_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as Row[]) ?? []));
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!me) {
      toast.error("Please sign in to follow this store.");
      return;
    }
    try {
      const res = await doToggleFollow({ data: { seller_id: userId } });
      setIsFollowing(res.following);
      setFollowersCount((prev) => (res.following ? prev + 1 : Math.max(0, prev - 1)));
      toast.success(res.following ? "Following store!" : "Unfollowed store");
    } catch (e: any) {
      toast.error(e.message || "Failed to follow store.");
    }
  };

  const handleShareStore = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Store link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white p-8 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/70">Sokonyumbani Store</div>
              <h1 className="text-3xl md:text-4xl font-extrabold mt-1">
                {profile?.full_name ?? "Seller"}
              </h1>
              <div className="mt-2 flex items-center gap-4 text-white/80 text-xs flex-wrap">
                {profile?.town && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {profile.town}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {followersCount} follower{followersCount === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {me && me !== userId && (
                <button
                  onClick={handleFollowToggle}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isFollowing
                      ? "bg-white/20 text-white hover:bg-white/30"
                      : "bg-white text-primary hover:bg-white/90 shadow"
                  }`}
                >
                  {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {isFollowing ? "Following" : "Follow Store"}
                </button>
              )}
              <button
                onClick={handleShareStore}
                className="px-3.5 py-2 rounded-xl bg-white/15 text-white hover:bg-white/25 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="h-4 w-4" /> Share Store
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((it) => (
              <Link
                key={it.id}
                to="/listing/$id"
                params={{ id: it.id }}
                className="group rounded-2xl overflow-hidden bg-card ring-1 ring-black/5 shadow-sm hover:shadow-lg transition"
              >
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  {it.image_url && (
                    <img
                      src={it.image_url}
                      alt={it.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  )}
                </div>
                <div className="p-3">
                  <div className="text-sm font-semibold line-clamp-1">{it.title}</div>
                  <div className="mt-1 text-primary-dark font-extrabold">
                    KSh {Number(it.price).toLocaleString()}
                  </div>
                </div>
              </Link>
            ))}
            {!items.length && (
              <div className="col-span-full text-muted-foreground">No active listings yet.</div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
