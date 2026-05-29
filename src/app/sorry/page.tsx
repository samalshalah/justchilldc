import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sorry",
  robots: { index: false, follow: false },
};

export default function SorryPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
      <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
        We&apos;ll see you when you&apos;re older.
      </h1>
      <p className="text-muted-foreground max-w-md mb-8">
        You must be 21 or older to access this site.
      </p>
      <Link
        href="https://www.google.com"
        className="text-accent hover:underline"
      >
        Take me somewhere else →
      </Link>
    </div>
  );
}
