"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

type RegenerateResult = {
  ok?: boolean;
  productsUpdated?: number;
  categoriesUpdated?: number;
  brandsUpdated?: number;
  error?: string;
};

export function SeoRegenerateButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RegenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const regenerate = () => {
    setResult(null);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/seo/regenerate", {
          method: "POST",
        });
        const data = (await res.json().catch(() => ({}))) as RegenerateResult;
        if (!res.ok) {
          throw new Error(data.error || `Regenerate failed (HTTP ${res.status})`);
        }
        setResult(data);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Regenerate failed");
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={regenerate}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        )}
        Regenerate local SEO
      </button>
      <p className="max-w-xs text-xs text-slate-500 sm:text-right">
        Updates SEO settings and stale generated product copy. Domain and
        Google verification are preserved.
      </p>
      {result?.ok && (
        <p className="text-xs font-semibold text-emerald-600 sm:text-right">
          SEO regenerated. Products: {result.productsUpdated ?? 0}, Categories:{" "}
          {result.categoriesUpdated ?? 0}, Brands: {result.brandsUpdated ?? 0}
        </p>
      )}
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
