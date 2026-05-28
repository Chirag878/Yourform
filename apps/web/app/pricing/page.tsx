"use client";

import Link from "next/link";
import { ArrowLeft, Check, CloudRain, HelpCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";

const pricingTiers = [
  {
    name: "Free / Hobby",
    price: "$0",
    description: "Perfect for testing ideas and personal use.",
    features: [
      "Up to 3 active forms",
      "100 responses per month",
      "Standard Monsoon Aurora themes",
      "Rate-limited spam protection",
      "Basic response list view",
    ],
    buttonText: "Get Started Free",
    href: "/auth",
    popular: false,
  },
  {
    name: "Pro Creator",
    price: "$29",
    billing: "/mo",
    description: "Designed for scaling products and active builders.",
    features: [
      "Unlimited active forms",
      "10,000 responses per month",
      "Full premium theme gallery access",
      "Advanced real-time analytics charts",
      "CSV response export capabilities",
      "Dynamic QR Code sharing generator",
    ],
    buttonText: "Upgrade to Pro",
    href: "/auth",
    popular: true,
  },
  {
    name: "Enterprise Studio",
    price: "$99",
    billing: "/mo",
    description: "Custom branding and maximum scale capabilities.",
    features: [
      "Unlimited forms & submissions",
      "Custom domain form slugs",
      "Priority console MAILER integrations",
      "Self-hosted Scalar API gateways",
      "Dedicated database connection transaction poolers",
      "24/7 priority creator support",
    ],
    buttonText: "Contact Sales",
    href: "/auth",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <main className="aurora-shell min-h-screen">
      <section className="mx-auto flex w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-wide text-white">
            <span className="flex size-10 items-center justify-center rounded-md border border-cyan-200/30 bg-white/10 text-cyan-100 shadow-lg">
              <CloudRain className="size-5" />
            </span>
            YourForm
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="text-cyan-50 hover:bg-white/10 hover:text-white">
              <Link href="/">Home</Link>
            </Button>
            <Button asChild className="bg-cyan-200 text-slate-950 hover:bg-cyan-100">
              <Link href="/auth">Login</Link>
            </Button>
          </div>
        </nav>

        <div className="py-16 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-200/20 bg-white/10 px-3 py-1 text-sm text-cyan-50 backdrop-blur">
            <Sparkles className="size-4 text-pink-200" />
            Flexible Pricing Options
          </div>
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl tracking-tight">
            Cinematic form building. Transparent plans.
          </h1>
          <p className="max-w-2xl mx-auto text-cyan-50/70 text-lg">
            Choose the tier that fits your workflow. Start collecting strictly validated responses and premium analytics today.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 py-6">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`glass-panel relative rounded-lg p-6 sm:p-8 flex flex-col justify-between border ${
                tier.popular
                  ? "border-cyan-400 bg-white/[0.04] shadow-cyan-950/20 shadow-xl"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-cyan-400 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-950">
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                  <p className="mt-2 text-sm text-cyan-50/60 min-h-10">{tier.description}</p>
                </div>

                <div className="flex items-baseline text-white">
                  <span className="text-5xl font-extrabold tracking-tight">{tier.price}</span>
                  {tier.billing && <span className="ml-1 text-xl font-semibold text-cyan-100/50">{tier.billing}</span>}
                </div>

                <ul className="space-y-4 border-t border-white/10 pt-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-cyan-50/80">
                      <Check className="size-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Button
                  asChild
                  className={`w-full py-6 font-semibold ${
                    tier.popular
                      ? "bg-cyan-200 text-slate-950 hover:bg-cyan-100"
                      : "bg-white/10 text-white hover:bg-white/15 border border-white/10"
                  }`}
                >
                  <Link href={tier.href}>{tier.buttonText}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-16 border-t border-white/10 py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-cyan-50/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-cyan-100/30" />
            <span>Secure stateless tokens, 100% verified SSL payloads, and custom backups.</span>
          </div>
          <span>YourForm pricing cockpit</span>
        </footer>
      </section>
    </main>
  );
}
