import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import type { SeoHealthReport, SeoHealthStatus } from "@/lib/seo-health";
import { SeoRegenerateButton } from "./SeoRegenerateButton";

const STATUS_STYLES: Record<SeoHealthStatus, string> = {
  good: "border-emerald-900 bg-emerald-950/20 text-emerald-300",
  warning: "border-amber-900 bg-amber-950/20 text-amber-300",
  missing: "border-red-900 bg-red-950/20 text-red-300",
};

function StatusIcon({ status }: { status: SeoHealthStatus }) {
  if (status === "good") return <CheckCircle2 className="w-4 h-4" />;
  if (status === "warning") return <AlertTriangle className="w-4 h-4" />;
  return <CircleDashed className="w-4 h-4" />;
}

export function SeoHealthPanel({
  report,
}: {
  report: SeoHealthReport;
}) {
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">SEO status</h2>
          <p className="text-sm text-zinc-400">
            Plain-English tasks for owners before connecting the domain.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-4">
          <SeoRegenerateButton />
          <div className="text-right">
            <p className="text-3xl font-bold text-amber-400">{report.score}%</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Ready</p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {report.items.map((item) => {
          const card = (
            <div
              className={`h-full border rounded-lg p-3 ${STATUS_STYLES[item.status]}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <StatusIcon status={item.status} />
                <h3 className="font-semibold text-zinc-100">{item.label}</h3>
              </div>
              <p className="text-sm text-zinc-300">{item.detail}</p>
            </div>
          );
          return item.href ? (
            <Link key={item.label} href={item.href} className="block">
              {card}
            </Link>
          ) : (
            <div key={item.label}>{card}</div>
          );
        })}
      </div>
    </section>
  );
}
