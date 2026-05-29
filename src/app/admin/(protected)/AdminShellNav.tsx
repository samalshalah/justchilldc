"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgePercent,
  BookOpen,
  Boxes,
  Building2,
  ClipboardList,
  Clock3,
  CreditCard,
  FileText,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Paintbrush,
  Package,
  Plug,
  SearchCheck,
  ShoppingBag,
  Tags,
  Wand2,
} from "lucide-react";

const NAV = [
  { type: "section", label: "Daily Work" },
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/onboarding", label: "Setup Wizard", icon: Wand2 },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },

  { type: "section", label: "Products & Catalog" },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/products/import", label: "Import Products", icon: ShoppingBag },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/brands", label: "Brands", icon: Tags },

  { type: "section", label: "Website & SEO" },
  { href: "/admin/store/pages", label: "Website Pages", icon: FileText },
  { href: "/admin/blog", label: "Blog", icon: BookOpen },
  { href: "/admin/store/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/store/seo", label: "SEO Checklist", icon: SearchCheck },
  { href: "/admin/store/theme", label: "Design", icon: Paintbrush },

  { type: "section", label: "Business & Operations" },
  { href: "/admin/store/info", label: "Business Info", icon: Building2 },
  { href: "/admin/store/hours", label: "Store Hours", icon: Clock3 },
  { href: "/admin/store/checkout", label: "Checkout", icon: CreditCard },
  { href: "/admin/deals", label: "Deal Rules", icon: BadgePercent },
  { href: "/admin/store/advanced", label: "Integrations", icon: Plug },
] as const;

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShellNav() {
  const pathname = usePathname();

  return (
    <nav className="px-2 py-3">
      {NAV.map((item, index) => {
        if ("type" in item) {
          return (
            <p
              key={`${item.label}-${index}`}
              className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
            >
              {item.label}
            </p>
          );
        }

        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
