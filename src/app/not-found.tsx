import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
      <h1 className="text-6xl md:text-8xl font-display font-bold text-foreground mb-4">
        404
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        We couldn&apos;t find the page you were looking for.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-accent text-accent-foreground font-bold rounded-full hover:bg-accent/90 transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
