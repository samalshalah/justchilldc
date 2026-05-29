"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("subscribe failed");
      toast.success("Subscribed!", {
        description: "You've successfully joined our VIP list.",
      });
      setEmail("");
    } catch {
      toast.error("Subscription failed", {
        description: "Please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        placeholder="Enter your email address"
        disabled={submitting}
        className="flex-grow px-5 py-3 rounded-full bg-background border border-border text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={submitting}
        className="px-6 py-3 bg-accent text-accent-foreground font-bold rounded-full hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 shrink-0 disabled:opacity-70"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Subscribe <Send className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
