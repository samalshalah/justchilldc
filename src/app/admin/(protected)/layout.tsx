import { cookies } from "next/headers";
import { createHmac } from "crypto";
import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { LoginForm } from "../login/LoginForm";
import { AdminShellNav } from "./AdminShellNav";
import { LogoutButton } from "./LogoutButton";

const COOKIE_NAME = "jc_admin_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function hmacHex(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message).digest("hex");
}

async function hasAdminSession(): Promise<boolean> {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;

  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return false;

  const [issuedAtStr, sig] = cookie.value.split(".");
  if (!issuedAtStr || !sig) return false;

  const issuedAt = parseInt(issuedAtStr, 10);
  if (isNaN(issuedAt)) return false;

  const ageSec = Math.floor(Date.now() / 1000) - issuedAt;
  if (ageSec < 0 || ageSec > SESSION_MAX_AGE_SEC) return false;

  return hmacHex(secret, issuedAtStr) === sig;
}

function LoginOnly() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-950 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-2 text-slate-950">Admin Login</h1>
        <p className="text-sm text-slate-500 mb-6">
          Enter the admin password to continue.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthed = await hasAdminSession();

  if (!isAuthed) return <LoginOnly />;

  const [{ getSiteSettings }, { DEFAULTS }] = await Promise.all([
    import("@/lib/settings"),
    import("@/lib/defaults"),
  ]);
  const settings = await getSiteSettings();
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const city = settings.location?.city || settings.seo?.city || DEFAULTS.city;

  return (
    <div className="admin-shell min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-40 flex h-[52px] items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-700 text-white">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-bold leading-tight text-slate-950">
              Store Admin
            </span>
            <span className="block text-xs leading-tight text-slate-500">
              White label storefront
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700"
          >
            View Store
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
            Admin
          </span>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-52px)]">
        <aside className="sticky top-[52px] hidden h-[calc(100vh-52px)] w-56 shrink-0 overflow-y-auto border-r border-slate-200 bg-white md:block">
          <div className="border-b border-slate-200 px-3 py-4">
            <p className="text-sm font-bold text-slate-950">{storeName}</p>
            <p className="mt-0.5 text-xs text-slate-500">{city} - Active</p>
          </div>
          <AdminShellNav />
          <div className="mt-4 border-t border-slate-200 p-4">
            <LogoutButton />
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
