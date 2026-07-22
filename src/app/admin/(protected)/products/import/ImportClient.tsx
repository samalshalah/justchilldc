"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  ArrowRight,
} from "lucide-react";
import {
  runImport,
  type ImportRowInput,
  type ImportResult,
} from "@/lib/admin-mutations-client";
import { parseInventoryCsv, titleCase } from "@/lib/import-csv-client";
import type { ParsedRowClient } from "@/lib/import-csv-client";
import { inferStrainType, type StrainType } from "@/lib/strain-database";
import { generateSeoDescription } from "@/lib/seo-generator";

type Stage = "upload" | "preview" | "running" | "done";

interface RowState extends ParsedRowClient {
  strainType: StrainType;
  /** Inference confidence: shown as a tooltip on the strain dropdown */
  strainConfidence: "high" | "medium" | "low";
  strainReason: string;
  /** Generated SEO description, editable per row */
  description: string;
  skip: boolean;
}

const STRAIN_OPTIONS: StrainType[] = ["Indica", "Sativa", "Hybrid", "CBD"];

interface ImportClientProps {
  onImported?: () => void;
}

export function ImportClient({ onImported }: ImportClientProps = {}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("upload");
  const [rows, setRows] = useState<RowState[]>([]);
  const [parseErrors, setParseErrors] = useState<{ row: number; message: string }[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<Record<string, string>>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [bulkStrain, setBulkStrain] = useState<StrainType>("Hybrid");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = async (file: File) => {
    setParseError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setParseError("Please upload a .csv file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setParseError("File too large (max 10MB). Split it and import in chunks.");
      return;
    }
    try {
      const text = await file.text();
      const { rows: parsed, errors, detectedColumns } = parseInventoryCsv(text);
      if (parsed.length === 0) {
        setParseError(
          errors[0]?.message ||
            "Couldn't parse any product rows from this file. Check the format."
        );
        return;
      }
      setRows(
        parsed.map((r) => {
          const inf = inferStrainType({
            strainName: r.strainName,
            productName: r.name,
          });
          const desc = generateSeoDescription({
            name: r.name,
            category: r.category,
            strainType: inf.type,
            strainName: r.strainName,
            thc: r.thc,
            cbd: r.cbd,
            brand: r.brand,
          });
          return {
            ...r,
            strainType: inf.type,
            strainConfidence: inf.confidence,
            strainReason: inf.reason,
            description: desc,
            skip: false,
          };
        })
      );
      setParseErrors(errors);
      setDetectedColumns(detectedColumns as Record<string, string>);
      setStage("preview");
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Could not read file");
    }
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const updateRow = (idx: number, patch: Partial<RowState>) => {
    setRows((rs) =>
      rs.map((r, i) => {
        if (i !== idx) return r;
        const next = { ...r, ...patch };
        // If user changed strain type and hasn't manually edited description,
        // re-generate so the description matches.
        if (patch.strainType && patch.description === undefined) {
          next.description = generateSeoDescription({
            name: next.name,
            category: next.category,
            strainType: next.strainType,
            strainName: next.strainName,
            thc: next.thc,
            cbd: next.cbd,
            brand: next.brand,
          });
        }
        return next;
      })
    );
  };

  const applyBulkStrain = () => {
    setRows((rs) =>
      rs.map((r) => {
        const next = { ...r, strainType: bulkStrain };
        next.description = generateSeoDescription({
          name: next.name,
          category: next.category,
          strainType: next.strainType,
          strainName: next.strainName,
          thc: next.thc,
          cbd: next.cbd,
          brand: next.brand,
        });
        return next;
      })
    );
  };

  const onRunImport = () => {
    setStage("running");
    const payload: ImportRowInput[] = rows.map((r) => ({
      sku: r.sku,
      name: r.name,
      category: r.category,
      brand: r.brand,
      strainName: r.strainName,
      price: r.price,
      quantity: r.quantity,
      thc: r.thc,
      cbd: r.cbd,
      weight: r.weight,
      inStock: r.inStock,
      strainType: r.strainType,
      description: r.description,
      skip: r.skip,
    }));
    startTransition(async () => {
      try {
        const res = await runImport(payload);
        setResult(res);
        setStage("done");
        router.refresh();
        onImported?.();
      } catch (err) {
        setParseError(err instanceof Error ? err.message : "Import failed");
        setStage("preview");
      }
    });
  };

  const reset = () => {
    setStage("upload");
    setRows([]);
    setParseErrors([]);
    setResult(null);
    setParseError(null);
  };

  // ───────────────────── UPLOAD STAGE ─────────────────────

  if (stage === "upload") {
    return (
      <div className="max-w-2xl">
        <label className="block w-full border-2 border-dashed border-zinc-700 rounded-2xl p-12 text-center cursor-pointer hover:border-amber-600 hover:bg-amber-950/10 transition-colors">
          <input
            type="file"
            className="hidden"
            accept=".csv,text/csv"
            onChange={onInput}
          />
          <Upload className="w-10 h-10 mx-auto text-zinc-500 mb-3" />
          <p className="text-lg font-medium text-zinc-200 mb-1">
            Click to upload your inventory CSV
          </p>
          <p className="text-sm text-zinc-500">
            We&rsquo;ll parse it and show you a preview before saving.
          </p>
        </label>
        {parseError && (
          <div className="mt-4 bg-red-950/40 border border-red-900 text-red-300 rounded-lg p-3 text-sm">
            {parseError}
          </div>
        )}
        <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-sm text-zinc-400">
          <p className="font-semibold text-zinc-200 mb-2">Expected columns</p>
          <p>
            We auto-detect these columns by name: <code>SKU</code>,{" "}
            <code>Product</code>, <code>Category</code>, <code>Brand</code> /{" "}
            <code>Vendor</code>, <code>Strain</code>, <code>Current Price</code>,{" "}
            <code>Available</code>, <code>THC</code>, <code>CBD</code>. Other
            columns are ignored. <code>Calculated THC (mg)</code> is not shown as
            THC unless the file also includes an explicit THC column.
          </p>
        </div>
      </div>
    );
  }

  // ───────────────────── PREVIEW STAGE ─────────────────────

  if (stage === "preview" || stage === "running") {
    const selected = rows.filter((r) => !r.skip).length;
    const conf = {
      high: rows.filter((r) => r.strainConfidence === "high").length,
      medium: rows.filter((r) => r.strainConfidence === "medium").length,
      low: rows.filter((r) => r.strainConfidence === "low").length,
    };
    return (
      <div>
        <div className="bg-emerald-950/30 border border-emerald-900 rounded-xl p-4 mb-4 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-200">
            Parsed <strong>{rows.length} products</strong>. Strain types
            inferred: <strong className="text-emerald-300">{conf.high} high</strong>,{" "}
            <strong className="text-amber-300">{conf.medium} medium</strong>,{" "}
            <strong className="text-zinc-400">{conf.low} default Hybrid</strong>.
            Each product also got a generated SEO description — review and edit
            below before importing.
          </div>
        </div>

        {parseErrors.length > 0 && (
          <details className="bg-amber-950/30 border border-amber-900 rounded-xl p-4 mb-4">
            <summary className="cursor-pointer text-sm font-medium text-amber-300">
              {parseErrors.length} row(s) skipped during parsing — click to see why
            </summary>
            <ul className="mt-2 space-y-1 text-xs text-amber-200">
              {parseErrors.slice(0, 30).map((e, i) => (
                <li key={i}>• {e.message}</li>
              ))}
              {parseErrors.length > 30 && (
                <li>...and {parseErrors.length - 30} more</li>
              )}
            </ul>
          </details>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
          <div className="text-sm text-zinc-300">
            <strong>Bulk apply strain type</strong> to all rows:
          </div>
          <select
            value={bulkStrain}
            onChange={(e) => setBulkStrain(e.target.value as StrainType)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-600"
          >
            {STRAIN_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyBulkStrain}
            className="px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg"
          >
            Apply to all
          </button>
          <span className="text-xs text-zinc-500 ml-auto">
            (You can override per-row below)
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-4">
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-3 py-2 text-xs uppercase text-zinc-400">
                    Import
                  </th>
                  <th className="text-left px-3 py-2 text-xs uppercase text-zinc-400">
                    SKU
                  </th>
                  <th className="text-left px-3 py-2 text-xs uppercase text-zinc-400">
                    Name
                  </th>
                  <th className="text-left px-3 py-2 text-xs uppercase text-zinc-400">
                    Category
                  </th>
                  <th className="text-left px-3 py-2 text-xs uppercase text-zinc-400">
                    THC
                  </th>
                  <th className="text-left px-3 py-2 text-xs uppercase text-zinc-400">
                    Size
                  </th>
                  <th className="text-left px-3 py-2 text-xs uppercase text-zinc-400">
                    Strain
                  </th>
                  <th className="text-left px-3 py-2 text-xs uppercase text-zinc-400">
                    Type
                  </th>
                  <th className="text-left px-3 py-2 text-xs uppercase text-zinc-400">
                    Brand
                  </th>
                  <th className="text-right px-3 py-2 text-xs uppercase text-zinc-400">
                    Price
                  </th>
                  <th className="text-right px-3 py-2 text-xs uppercase text-zinc-400">
                    Qty
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {rows.map((r, i) => (
                  <tr
                    key={`${r.sku}-${i}`}
                    className={r.skip ? "opacity-40" : ""}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={!r.skip}
                        onChange={(e) =>
                          updateRow(i, { skip: !e.target.checked })
                        }
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 accent-amber-600"
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-zinc-400">
                      {r.sku}
                    </td>
                    <td className="px-3 py-2 max-w-[280px] truncate">
                      {r.name}
                      {r.warnings.length > 0 && (
                        <span
                          className="ml-1 inline-flex"
                          title={r.warnings.join("; ")}
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-zinc-400">{r.category}</td>
                    <td className="px-3 py-2 text-zinc-400 font-mono">
                      {r.thc || "-"}
                    </td>
                    <td className="px-3 py-2 text-zinc-400 font-mono">
                      {r.weight || "-"}
                    </td>
                    <td className="px-3 py-2 text-zinc-400 max-w-[150px] truncate">
                      {r.strainName ? titleCase(r.strainName) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            r.strainConfidence === "high"
                              ? "bg-emerald-500"
                              : r.strainConfidence === "medium"
                              ? "bg-amber-500"
                              : "bg-zinc-600"
                          }`}
                          title={`${r.strainConfidence} confidence: ${r.strainReason}`}
                          aria-label={`Confidence: ${r.strainConfidence}. ${r.strainReason}`}
                        />
                        <select
                          value={r.strainType}
                          onChange={(e) =>
                            updateRow(i, { strainType: e.target.value as StrainType })
                          }
                          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-100"
                        >
                          {STRAIN_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-zinc-400 max-w-[120px] truncate">
                      {r.brand ? titleCase(r.brand) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      ${r.price}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {r.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {parseError && (
          <div className="mb-4 bg-red-950/40 border border-red-900 text-red-300 rounded-lg p-3 text-sm">
            {parseError}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRunImport}
            disabled={pending || selected === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            Import {selected} product{selected === 1 ? "" : "s"}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={pending}
            className="px-5 py-2.5 border border-zinc-700 hover:bg-zinc-800 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <span className="text-sm text-zinc-500 ml-auto">
            Existing products are matched by SKU and updated; new SKUs are
            inserted.
          </span>
        </div>
      </div>
    );
  }

  // ───────────────────── DONE STAGE ─────────────────────

  if (stage === "done" && result) {
    return (
      <div className="max-w-2xl">
        <div className="bg-emerald-950/30 border border-emerald-900 rounded-2xl p-6 mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">
            Import complete
          </h2>
          <ul className="space-y-1 text-zinc-300">
            <li>
              <strong className="text-emerald-400">{result.inserted}</strong>{" "}
              new products created
            </li>
            <li>
              <strong className="text-blue-400">{result.updated}</strong>{" "}
              existing products updated
            </li>
            {result.skipped > 0 && (
              <li>
                <strong className="text-zinc-500">{result.skipped}</strong>{" "}
                rows skipped (you unchecked them)
              </li>
            )}
            {result.brandsCreated.length > 0 && (
              <li>
                <strong className="text-amber-400">
                  {result.brandsCreated.length}
                </strong>{" "}
                new brands created: {result.brandsCreated.join(", ")}
              </li>
            )}
            {result.categoriesCreated.length > 0 && (
              <li>
                <strong className="text-amber-400">
                  {result.categoriesCreated.length}
                </strong>{" "}
                new categories created: {result.categoriesCreated.join(", ")}
              </li>
            )}
          </ul>
        </div>

        {result.errors.length > 0 && (
          <div className="bg-red-950/30 border border-red-900 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <X className="w-4 h-4 text-red-400" />
              <p className="font-semibold text-red-300">
                {result.errors.length} row(s) failed
              </p>
            </div>
            <ul className="space-y-1 text-sm text-red-200 max-h-64 overflow-y-auto">
              {result.errors.map((e, i) => (
                <li key={i}>
                  Row {e.row} (SKU {e.sku}): {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg"
          >
            View products
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-5 py-2.5 border border-zinc-700 hover:bg-zinc-800 rounded-lg"
          >
            Import another file
          </button>
        </div>
      </div>
    );
  }

  return null;
}
