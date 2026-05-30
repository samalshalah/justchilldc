import Link from "next/link";
import { redirect } from "next/navigation";
import { sql, count, gte } from "drizzle-orm";
import { db, productsTable, ordersTable, siteSettingsTable } from "@/lib/db";
import { isLocalPreviewMode } from "@/lib/preview";
import { getSiteSettings } from "@/lib/settings";
import type { SiteSettings } from "@/lib/types";

async function getDashboardStats() {
  if (isLocalPreviewMode()) {
    return { productCount: 0, pendingOrders: 0, todayOrders: 0, todayRevenue: 0 };
  }
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [productCount] = await db
      .select({ n: count() })
      .from(productsTable);
    const [settingCount] = await db
      .select({ n: count() })
      .from(siteSettingsTable);
    const [pendingOrders] = await db
      .select({ n: count() })
      .from(ordersTable)
      .where(sql`${ordersTable.status} = 'pending'`);
    const [todayOrders] = await db
      .select({ n: count() })
      .from(ordersTable)
      .where(gte(ordersTable.createdAt, today));
    const [revenue] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${ordersTable.totalPrice}), 0)::int`,
      })
      .from(ordersTable)
      .where(gte(ordersTable.createdAt, today));

    return {
      productCount: productCount.n,
      settingCount: settingCount.n,
      pendingOrders: pendingOrders.n,
      todayOrders: todayOrders.n,
      todayRevenue: revenue.total ?? 0,
    };
  } catch (err) {
    console.error("[admin/dashboard] stats failed:", err);
    return {
      productCount: 0,
      settingCount: 0,
      pendingOrders: 0,
      todayOrders: 0,
      todayRevenue: 0,
    };
  }
}

function hasMeaningfulSetup(settings: SiteSettings): boolean {
  return Boolean(
    settings.store?.name?.trim() ||
      settings.location?.address?.trim() ||
      settings.contact?.email?.trim() ||
      settings.seo?.meta_description?.trim() ||
      settings.homepage_sections?.hero?.headline?.trim()
  );
}

export default async function AdminDashboard() {
  const [stats, settings] = await Promise.all([getDashboardStats(), getSiteSettings()]);

  if (
    !isLocalPreviewMode() &&
    stats.productCount === 0 &&
    stats.settingCount === 0 &&
    !hasMeaningfulSetup(settings)
  ) {
    redirect("/admin/onboarding");
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-zinc-400 mb-8">
        Simple controls for products, orders, website content, and SEO.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card label="Today's Orders" value={stats.todayOrders} />
        <Card label="Today's Revenue" value={`$${stats.todayRevenue}`} />
        <Card label="Pending Orders" value={stats.pendingOrders} />
        <Card label="Active Products" value={stats.productCount} />
      </div>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold">Recommended setup order</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Start here when onboarding a store or checking launch readiness.
            </p>
          </div>
          <Link
            href="/admin/onboarding"
            className="inline-flex px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-sm font-semibold text-white"
          >
            Open setup wizard
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <QuickLink
            href="/admin/onboarding"
            title="1. Setup Wizard"
            desc="Business info, inventory guidance, SEO page copy, and FAQs in one flow."
          />
          <QuickLink
            href="/admin/store/info"
            title="2. Business Info"
            desc="Name, logos, address, phone, email, socials."
          />
          <QuickLink
            href="/admin/products/import"
            title="3. Import Products"
            desc="Upload CSV; categories and brands are created from the file."
          />
          <QuickLink
            href="/admin/store/pages"
            title="4. Website Pages"
            desc="Homepage, shop page, location page, and page copy."
          />
          <QuickLink
            href="/admin/store/seo"
            title="5. SEO Checklist"
            desc="Search titles, descriptions, city, schema, indexing."
          />
          <QuickLink
            href="/admin/store/theme"
            title="6. Design"
            desc="Colors, typography, and site-wide visual style."
          />
          <QuickLink
            href="/admin/store/checkout"
            title="7. Checkout"
            desc="Ordering rules, terms, tipping, and emergency order pause."
          />
        </div>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-bold mb-2">Where controls live now</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Each decision has one main place, so owners do not have to hunt through the backend.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ControlHint
            title="Business identity"
            desc="Business Info: name, logo, address, contact, social links."
          />
          <ControlHint
            title="Visible page copy"
            desc="Website Pages: homepage, shop heading, location intro, contact intro."
          />
          <ControlHint
            title="Search metadata"
            desc="SEO Checklist: Google titles/descriptions and structured data."
          />
          <ControlHint
            title="Product card layout"
            desc="Website Pages > Shop: filters, cards per row, badges, and image overlay."
          />
        </div>
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-xs uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="text-3xl font-bold text-amber-500 mt-1">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-zinc-950 border border-zinc-800 rounded-xl p-4 hover:border-amber-700 transition-colors"
    >
      <p className="font-medium">{title}</p>
      <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{desc}</p>
      <p className="text-xs text-amber-500 mt-3">Open</p>
    </Link>
  );
}

function ControlHint({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
      <p className="font-medium text-zinc-100">{title}</p>
      <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}
