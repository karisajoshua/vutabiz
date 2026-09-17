import { createFileRoute, Link } from "@tanstack/react-router";
import { Header, Footer } from "@/components/site-chrome";
import {
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Eye,
  CreditCard,
  PhoneCall,
  UserCheck,
  CheckCircle2,
  FileText,
  BadgeAlert,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/safety")({
  component: SafetyPage,
  head: () => ({
    meta: [
      { title: "Safety Tips & Buyer Guide — Sokonyumbani" },
      {
        name: "description",
        content: "Learn how to buy and sell safely on Sokonyumbani. Verified sellers, scam prevention tips, and safe meeting locations in Kenya.",
      },
    ],
  }),
});

export default function SafetyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-primary-dark text-white py-12 px-4 border-b border-primary/20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" /> Trust &amp; Safety Hub
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Trade Safely, Buy Confidently
          </h1>
          <p className="mt-3 text-sm sm:text-base text-white/80 max-w-2xl mx-auto">
            Sokonyumbani is built for honest Kenyan commerce. Follow these simple, proven rules to protect yourself and make every deal safe and smooth.
          </p>
        </div>
      </section>

      {/* Main content */}
      <main className="flex-1 mx-auto max-w-5xl px-4 py-12 space-y-12">
        {/* The Golden Rule */}
        <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-start">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-md">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-950 dark:text-amber-200">
              The #1 Rule of Online Classifieds: Never Pay in Advance
            </h2>
            <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              Do not send money before you have physically seen and inspected the item. Never send "fare", "booking fee", "fuel money", or "courier advance" to someone you have not met in person. Scammers disappear the second an advance payment is sent.
            </p>
          </div>
        </div>

        {/* 6 Essential Buyer Rules */}
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground mb-6 flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" /> 6 Essential Rules for Buyers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <MapPin className="h-5 w-5 text-primary" /> 1. Meet in Public, Daylight Places
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose busy public venues like shopping malls, petrol stations, or near police posts. Avoid quiet alleyways, secluded homes, or hotel rooms.
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> 2. Inspect Items Thoroughly
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Test electronic gadgets, check phone IMEI numbers, test chargers, and inspect car logbooks with NTSA TIMS before paying.
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <CreditCard className="h-5 w-5 text-blue-600" /> 3. Pay via Traceable M-Pesa Only
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Send M-Pesa directly to the seller's registered phone or Buy Goods Till when holding the item. Never use wire transfers, vouchers, or anonymous money services.
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <UserCheck className="h-5 w-5 text-emerald-600" /> 4. Look for the "Verified Seller" Badge
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sellers with the green shield badge have uploaded verified National ID and KRA documentation checked by our compliance team.
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <BadgeAlert className="h-5 w-5 text-amber-600" /> 5. If It Sounds Too Cheap, It's a Scam
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                An iPhone 14 Pro Max for KSh 15,000 or a Toyota Vitz for KSh 150,000 does not exist. Unrealistically low prices are designed to lure impulsive deposits.
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <FileText className="h-5 w-5 text-purple-600" /> 6. Ask for Receipts &amp; Logbooks
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                For phones, laptops, and vehicles, request the original receipt, packaging, or logbook transfer to ensure you are not buying stolen property.
              </p>
            </div>
          </div>
        </div>

        {/* Safety for Sellers */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-emerald-600" /> Rules for Sellers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <div className="font-bold text-sm text-foreground">Check Your Own M-Pesa SMS</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Never trust a screenshot shown on the buyer's phone. Always check the actual SMS received from MPESA on your own handset.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-sm text-foreground">Beware of Fake Reversal Claims</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If a buyer claims they "overpaid by mistake", do not send cash back immediately. Call Safaricom customer care (100) first to verify.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-sm text-foreground">Never Hand Goods Before Payment</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ensure the funds are confirmed in your M-Pesa or bank account before letting the buyer drive away or carry the goods.
              </p>
            </div>
          </div>
        </div>

        {/* Report Section */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-foreground">Notice Something Suspicious?</h3>
            <p className="text-sm text-muted-foreground max-w-xl">
              Every listing on Sokonyumbani features a "Report this listing" button. Our moderation team reviews flagged ads within 1 hour.
            </p>
          </div>
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary-dark transition"
          >
            Browse Safely <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
