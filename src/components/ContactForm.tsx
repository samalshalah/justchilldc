"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export function ContactForm({
  successMessage = "We'll get back to you within 24 hours.",
}: {
  successMessage?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      toast.success("Message sent!", {
        description: successMessage,
      });
      setFormData({ name: "", email: "", message: "" });
    } catch {
      toast.error("Couldn't send your message", {
        description: "Please try again or contact us directly.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 space-y-4"
    >
      <h2 className="text-2xl font-display font-bold text-foreground mb-2">
        Send a Message
      </h2>

      <div>
        <label
          htmlFor="contact-name"
          className="block text-sm font-medium text-foreground/80 mb-1.5"
        >
          Name
        </label>
        <input
          id="contact-name"
          type="text"
          required
          autoComplete="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
        />
      </div>

      <div>
        <label
          htmlFor="contact-email"
          className="block text-sm font-medium text-foreground/80 mb-1.5"
        >
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          required
          autoComplete="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
        />
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-foreground/80 mb-1.5"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={4}
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-6 py-3 bg-accent text-accent-foreground font-bold rounded-xl hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Send Message <Send className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
