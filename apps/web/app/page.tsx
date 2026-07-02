"use client";

import React, { useState, useEffect } from "react";
import DotGrid from "@/components/DotGrid";
import FeatureCard from "@/components/FeatureCard";
import FlowPreview from "@/components/FlowPreview";
import GhostButton from "@/components/GhostButton";
import PrimaryButton from "@/components/PrimaryButton";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

const features = [
  {
    tag: "01 — TRIGGER",
    title: "Manual Trigger",
    description:
      "Fire any workflow instantly with a single click. Full control over when your pipeline runs.",
  },
  {
    tag: "02 — TRIGGER",
    title: "Webhook Trigger",
    description:
      "Expose a POST endpoint per node. Any external service can kick off your workflow in real time.",
  },
  {
    tag: "03 — TRIGGER",
    title: "Scheduler",
    description:
      "Run workflows on a repeating interval — 30s, 5m, 1h. Set it once and let it run forever.",
  },
  {
    tag: "04 — AI",
    title: "Gemini Node",
    description:
      "Drop in a Gemini 2.5 Flash or Pro node. Wire any upstream data as context and get AI output downstream.",
  },
  {
    tag: "05 — LOGIC",
    title: "Merge Node",
    description:
      "Collect outputs from multiple parallel branches and combine them into a single stream.",
  },
  {
    tag: "06 — OUTPUT",
    title: "Email via Resend",
    description:
      "Send the result of any workflow directly to an inbox. Powered by Resend with your own API key.",
  },
];

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-9 h-9" />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px] text-amber-500" />
      ) : (
        <Moon className="h-[18px] w-[18px] text-indigo-600" />
      )}
    </button>
  );
};

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white dark:bg-[#111111] text-neutral-900 dark:text-[#e8e8e8] font-[var(--font-mono)] transition-colors duration-200">
      <DotGrid />

      <div className="relative z-10">
        <nav className="flex items-center justify-between border-b border-neutral-200 dark:border-[#1a1a1a] px-10 py-5">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.svg"
              alt="g8g logo"
              width={36}
              height={36}
              className="dark:invert flex-shrink-0"
            />
          </Link>

          <div className="flex items-center space-x-4">
            <ThemeToggle />

            <SignedOut>
              <SignInButton mode="modal">
                <GhostButton>sign in →</GhostButton>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <GhostButton onClick={() => router.push("/workspace")}>
                workspace →
              </GhostButton>
            </SignedIn>
          </div>
        </nav>

        <section className="mx-auto max-w-[900px] px-10 pb-[60px] pt-[100px]">
          <div className="mb-7 font-[var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-neutral-400 dark:text-[#444]">
            g8g - Visual Workflow Automation
          </div>

          <h1 className="mb-8 text-[clamp(48px,8vw,96px)] font-normal leading-none tracking-[-0.03em] text-neutral-900 dark:text-white">
            Build workflows
            <br />
            <span className="text-neutral-300 dark:text-[#333]">
              that run themselves.
            </span>
          </h1>

          <p className="mb-10 max-w-[460px] text-[13px] leading-[1.9] text-neutral-500 dark:text-[#555]">
            Connect triggers, AI models, and outputs on a visual canvas. No
            config files. No boilerplate. Just nodes and edges.
          </p>

          <FlowPreview />

          <div className="mt-[52px] flex flex-wrap items-center gap-5">
            <SignedOut>
              <SignInButton mode="modal">
                <PrimaryButton>get started →</PrimaryButton>
              </SignInButton>
              <span className="text-[11px] tracking-[0.04em] text-neutral-400 dark:text-[#383838]">
                free to use · bring your own keys
              </span>
            </SignedOut>

            <SignedIn>
              <PrimaryButton onClick={() => router.push("/workspace")}>
                get started →
              </PrimaryButton>
              <span className="text-[11px] tracking-[0.04em] text-neutral-400 dark:text-[#383838]">
                you&apos;re signed in
              </span>
            </SignedIn>
          </div>
        </section>

        <section className="mx-auto max-w-[900px] px-10 py-20">
          <div className="mb-12 font-[var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-neutral-400 dark:text-[#444]">
            what&apos;s inside
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-px overflow-hidden rounded-[16px] border border-neutral-200 dark:border-[#1a1a1a] bg-neutral-200 dark:bg-[#1a1a1a]">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[900px] px-10 pb-[120px] pt-10">
          <div className="flex flex-wrap items-center justify-between gap-8 rounded-[20px] border border-neutral-200 dark:border-[#1a1a1a] bg-neutral-50 dark:bg-[#0d0d0d] px-12 py-[60px]">
            <div>
              <h2 className="mb-3 text-[clamp(28px,4vw,42px)] font-normal tracking-[-0.02em] text-neutral-900 dark:text-white">
                Ready to automate?
              </h2>
              <p className="m-0 font-[var(--font-mono)] text-[12px] leading-[1.7] text-neutral-400 dark:text-[#444]">
                Sign in and build your first workflow in under a minute.
              </p>
            </div>

            <SignedOut>
              <SignInButton mode="modal">
                <PrimaryButton>get started →</PrimaryButton>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <PrimaryButton onClick={() => router.push("/workspace")}>
                get started →
              </PrimaryButton>
            </SignedIn>
          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-neutral-100 dark:border-[#1a1a1a] px-10 py-6">
          <span className="font-[var(--font-display)] text-[16px] text-neutral-300 dark:text-[#282828]">
            g8g
          </span>
          <span className="font-[var(--font-mono)] text-[11px] text-neutral-400 dark:text-[#2e2e2e]">
            bring your own keys. own your data.
          </span>
        </footer>
      </div>
    </div>
  );
}
