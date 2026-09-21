import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Header, Footer } from "@/components/site-chrome";
import { Loader2, MapPin, User, Mail, Lock, Phone, ShieldAlert, AlertCircle, Eye, EyeOff } from "lucide-react";
import { STATIC_SUB_COUNTIES } from "@/lib/location-data";

const search = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign In / Register — Sokonyumbani" },
      { name: "description", content: "Sign in or create your free Sokonyumbani account to buy and sell locally in Kenya." },
    ],
  }),
});

type County = { id: number; name: string };
type SubCounty = { id: number; county_id: number; name: string };
type Ward = { id: number; county_id: number; sub_county_id: number | null; name: string };

const ADMIN_EMAIL = "admins@gmail.com";

function AuthPage() {
  const { next } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [counties, setCounties] = useState<County[]>([]);
  const [subCounties, setSubCounties] = useState<SubCounty[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [countyId, setCountyId] = useState<number | "">("");
  const [subCountyId, setSubCountyId] = useState<number | "">("");
  const [wardId, setWardId] = useState<number | "">("");
  const [town, setTown] = useState("");
  const [building, setBuilding] = useState("");

  // Admin state
  const [adminNotFound, setAdminNotFound] = useState(false);
  const isAdminEmail = email.trim().toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
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
      try {
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
          const normalized = (data as any[]).map((r) => ({
            id: r.id,
            county_id: r.county_id,
            sub_county_id: r.sub_county_id ?? r.subcounty_id ?? null,
            name: r.name,
          })) as Ward[];
          acc.push(...normalized);
          if (data.length < pageSize) break;
          from += pageSize;
        }
        setWards(acc);
      } catch {
        setWards([]);
      }
    })();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const userEmail = data.session.user?.email || "";
        const destination = next ?? (userEmail.trim().toLowerCase() === ADMIN_EMAIL ? "/admin" : "/dashboard");
        window.location.href = destination;
      }
    });
  }, [next]);

  const subCountiesForCounty = useMemo(
    () => subCounties.filter((sc) => sc.county_id === Number(countyId)),
    [subCounties, countyId],
  );

  const wardsForSubCounty = useMemo(
    () =>
      wards.filter(
        (w) =>
          w.county_id === Number(countyId) &&
          (subCountyId ? w.sub_county_id === Number(subCountyId) : true),
      ),
    [wards, countyId, subCountyId],
  );

  // When admin email typed in sign-in mode: reset the "not found" flag
  useEffect(() => {
    setAdminNotFound(false);
  }, [email, mode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAdminNotFound(false);
    try {
      if (mode === "signup") {
        // For admin email: skip location requirement, use sensible defaults
        const effectiveCounty = isAdminEmail ? 47 : countyId; // 47 = Nairobi
        if (!fullName || !phone) throw new Error("Name and phone are required");
        if (phone.length < 10) throw new Error("Please enter a valid phone number");
        if (!isAdminEmail && !effectiveCounty) throw new Error("County is required");

        const { data: signUpData, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
              phone,
              county_id: String(effectiveCounty || 47),
              sub_county_id: subCountyId ? String(subCountyId) : "",
              ward_id: wardId ? String(wardId) : "",
              town: town || (isAdminEmail ? "Nairobi CBD" : null),
              building: building || null,
            },
          },
        });
        if (error) throw error;
        // If Supabase requires email confirmation, session will be null.
        // In that case stay on page and ask user to verify their email.
        if (!signUpData.session) {
          toast.success("Account created! Please check your email to confirm your account before signing in.");
          setLoading(false);
          return;
        }
        toast.success("Account created — you're signed in!");
        const targetEmail = email.trim().toLowerCase();
        const destination = next ?? (targetEmail === ADMIN_EMAIL ? "/admin" : "/dashboard");
        // Hard redirect so the router re-runs all beforeLoad guards with the new session
        window.location.href = destination;
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) {
          // If admin email fails to sign in, the account doesn't exist yet
          if (isAdminEmail && (error.message.toLowerCase().includes("invalid") || error.message.toLowerCase().includes("credentials"))) {
            setAdminNotFound(true);
            setLoading(false);
            return;
          }
          throw error;
        }
        toast.success("Welcome back!");
        const targetEmail = email.trim().toLowerCase();
        const destination = next ?? (targetEmail === ADMIN_EMAIL ? "/admin" : "/dashboard");
        // Hard redirect so the router re-runs all beforeLoad guards with the fresh session
        window.location.href = destination;
        return;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  // One-click admin registration
  async function registerAdmin() {
    if (!password || password.length < 8) {
      toast.error("Enter a password of at least 8 characters first");
      return;
    }
    setLoading(true);
    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: ADMIN_EMAIL,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: {
            full_name: "Sokonyumbani Admin",
            phone: "0700000000",
            county_id: "47",
            ward_id: "",
            town: "Nairobi CBD",
            building: "Admin",
          },
        },
      });
      if (error) throw error;
      if (!signUpData.session) {
        toast.success("Admin account created! Please check your email to confirm before signing in.");
        setLoading(false);
        return;
      }
      toast.success("Admin account created! Redirecting…");
      // Hard redirect so the router re-runs all beforeLoad guards with the new session
      window.location.href = "/admin";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 grid place-items-center py-6 px-4 relative">
        <div
          aria-hidden
          className="absolute top-1/4 left-1/10 w-72 h-72 rounded-full bg-primary/5 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute bottom-1/4 right-1/10 w-72 h-72 rounded-full bg-accent/5 blur-3xl"
        />

        <div className="w-full max-w-lg bg-card rounded-xl shadow-lg border border-border/40 p-7 z-10">
          <div className="text-center mb-5">
            <h1 className="text-xl font-extrabold text-primary-dark tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your Sokonyumbani account"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to buy, sell and make offers locally."
                : "Join thousands of verified local traders across Kenya."}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex rounded-full bg-muted p-0.5 text-xs font-semibold mb-4">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-full py-1.5 transition-all duration-300 ${mode === "signin" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full py-1.5 transition-all duration-300 ${mode === "signup" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Sign Up
            </button>
          </div>

          {/* ── ADMIN NOT FOUND BANNER ── */}
          {adminNotFound && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs mb-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Admin account not set up yet
              </div>
              <p className="text-amber-700 text-[11px] leading-relaxed mb-2.5">
                The admin account <strong>admins@gmail.com</strong> hasn't been created in the database yet.
                Click the button below to create it now using the password you entered.
              </p>
              <button
                type="button"
                onClick={registerAdmin}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 text-xs font-bold transition shadow cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…</>
                ) : (
                  <><ShieldAlert className="h-3.5 w-3.5" /> Create Admin Account &amp; Sign In</>
                )}
              </button>
            </div>
          )}

          {/* ── ADMIN BADGE ── shown on sign-in page when admin email typed */}
          {isAdminEmail && mode === "signin" && !adminNotFound && (
            <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-primary-dark">
              <ShieldAlert className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Admin credentials detected — will redirect to control panel on login.</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  icon={User}
                  value={fullName}
                  onChange={setFullName}
                  placeholder="e.g. John Kamau"
                  required
                />
                <Input
                  label="Phone Number"
                  icon={Phone}
                  value={phone}
                  onChange={setPhone}
                  placeholder="e.g. 0712345678"
                  required
                />
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              value={email}
              onChange={setEmail}
              placeholder="name@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              icon={Lock}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
            />

            {mode === "signup" && !isAdminEmail && (
              <div className="pt-4 border-t border-border/50 space-y-4">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" /> Location details
                </div>
                <div className="space-y-4">
                  <Select
                    label="County *"
                    value={countyId}
                    onChange={(v) => {
                      setCountyId(v === "" ? "" : Number(v));
                      setSubCountyId("");
                      setWardId("");
                    }}
                    options={[
                      { value: "", label: "Select County" },
                      ...counties.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                  />
                  <Select
                    label="Sub-County"
                    value={subCountyId}
                    onChange={(v) => {
                      setSubCountyId(v === "" ? "" : Number(v));
                      setWardId("");
                    }}
                    options={[
                      { value: "", label: countyId ? "Select Sub-County" : "— Select County First" },
                      ...subCountiesForCounty.map((sc) => ({ value: sc.id, label: sc.name })),
                    ]}
                    disabled={!countyId}
                  />
                  <Select
                    label="Ward"
                    value={wardId}
                    onChange={(v) => setWardId(v === "" ? "" : Number(v))}
                    options={[
                      { value: "", label: wardsForSubCounty.length ? "Select Ward" : "— Select Sub-County First" },
                      ...wardsForSubCounty.map((w) => ({ value: w.id, label: w.name })),
                    ]}
                    disabled={!subCountyId}
                  />
                  <Input
                    label="Town / Estate"
                    value={town}
                    onChange={setTown}
                    placeholder="e.g. Kilimani"
                  />
                  <Input
                    label="Building / Landmark"
                    value={building}
                    onChange={setBuilding}
                    placeholder="e.g. Greenhouse"
                  />
                </div>
              </div>
            )}

            {/* Admin signup shortcut notice */}
            {mode === "signup" && isAdminEmail && (
              <div className="flex items-start gap-1.5 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-[11px] text-primary-dark">
                <ShieldAlert className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>Admin account will be set up with default Nairobi location. You'll be redirected to the admin dashboard.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-dark hover:bg-primary text-white px-4 py-3.5 text-sm font-bold transition-all duration-300 shadow hover:shadow-md disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
              ) : mode === "signin" ? (
                "Sign In to Sokonyumbani"
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="block">
      <div className="text-sm font-semibold text-foreground mb-2">{label}</div>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/80" />
        )}
        <input
          type={inputType}
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-12 rounded-xl border border-input bg-white outline-none focus:ring-2 focus:ring-primary text-base transition-all placeholder:text-muted-foreground/50 shadow-sm ${
            Icon ? "pl-12" : "pl-4"
          } ${isPassword ? "pr-12" : "pr-4"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground p-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  options: { value: number | ""; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="block">
      <div className="text-sm font-semibold text-foreground mb-2">{label}</div>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="w-full h-12 rounded-xl border border-input bg-white px-4 outline-none focus:ring-2 focus:ring-primary text-base disabled:bg-muted/70 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        {options.map((o) => (
          <option key={String(o.value)} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}