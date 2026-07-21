import type { Metadata } from "next";
import { DutchieEmbed } from "@/components/DutchieEmbed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Dutchie Embed Preview",
  description: "Internal preview page for testing the Dutchie embedded menu.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function DutchiePreviewPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Internal preview
          </p>
          <h1 className="mt-2 text-3xl font-bold">Dutchie Embed Preview</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            This page is intentionally unlinked from the storefront navigation
            and marked noindex. Use it to confirm the Dutchie embedded menu
            before deciding whether to replace or integrate inventory syncing.
          </p>
        </div>

        <DutchieEmbed />
      </div>
    </main>
  );
}
