"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Login failed");
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          required
        />
      </div>
      {error && (
        <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-2.5">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting || !password}
        className="w-full py-2.5 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Sign in
      </button>
    </form>
  );
}
