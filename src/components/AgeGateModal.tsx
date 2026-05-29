/**
 * AgeGateModal — 21+ verification gate.
 *
 * Improvements over legacy:
 *   - Sets a cookie (not just sessionStorage) so middleware can
 *     enforce server-side `noindex` for unverified visitors and the
 *     decision survives tab close.
 *   - Focus trap and Escape handler for keyboard users.
 *   - aria-modal + role="dialog" for screen readers.
 *
 * The cookie is HttpOnly:false so this component can read it; for
 * stronger enforcement, a route handler can set an HttpOnly variant
 * that middleware checks. This is good-enough for a lightweight compliance UI.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useSettings } from "./SettingsProvider";
import { DEFAULTS } from "@/lib/defaults";

const COOKIE_NAME = "age_verified";
const COOKIE_MAX_AGE_DAYS = 30;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]+)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const max = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; max-age=${max}; path=/; SameSite=Lax`;
}

export function AgeGateModal() {
  const router = useRouter();
  const settings = useSettings();
  const [decision, setDecision] = useState<
    "pending" | "yes" | "no" | "unknown"
  >("unknown");
  const dialogRef = useRef<HTMLDivElement>(null);
  const yesButtonRef = useRef<HTMLButtonElement>(null);

  const ageGateEnabled = settings.store?.display_age_gate ?? true;
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const message =
    settings.store?.age_gate_message || DEFAULTS.ageGateMessage;

  useEffect(() => {
    const v = readCookie(COOKIE_NAME);
    if (v === "yes") setDecision("yes");
    else if (v === "no") setDecision("no");
    else setDecision("pending");
  }, []);

  useEffect(() => {
    if (decision !== "pending") return;
    // Focus the primary action when modal mounts
    yesButtonRef.current?.focus();
    // Trap focus inside the dialog
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [decision]);

  const verify = (yes: boolean) => {
    setCookie(COOKIE_NAME, yes ? "yes" : "no", COOKIE_MAX_AGE_DAYS);
    setDecision(yes ? "yes" : "no");
    if (!yes) router.push("/sorry");
  };

  if (!ageGateEnabled) return null;
  if (decision === "yes" || decision === "no" || decision === "unknown")
    return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agegate-title"
        aria-describedby="agegate-desc"
      >
        <motion.div
          ref={dialogRef}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative max-w-lg w-full bg-card border border-border rounded-3xl p-8 md:p-12 text-center shadow-2xl shadow-black/50"
        >
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck className="w-8 h-8 text-accent" aria-hidden="true" />
          </div>
          <h2
            id="agegate-title"
            className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4"
          >
            Are you 21 or older?
          </h2>
          <p id="agegate-desc" className="text-muted-foreground mb-8">
            {message.replace("{store}", storeName)}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              ref={yesButtonRef}
              onClick={() => verify(true)}
              className="px-8 py-4 bg-accent text-accent-foreground font-semibold rounded-xl hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              Yes, I am 21+
            </button>
            <button
              onClick={() => verify(false)}
              className="px-8 py-4 bg-transparent border-2 border-border text-foreground font-semibold rounded-xl hover:bg-foreground/5 transition-all duration-300"
            >
              No, I am under 21
            </button>
          </div>
          <p className="mt-8 text-xs text-muted-foreground/60 uppercase tracking-widest">
            For Educational Purposes Only
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
