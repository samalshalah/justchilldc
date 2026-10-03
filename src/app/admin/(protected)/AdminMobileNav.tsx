"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, MoreHorizontal, Package, ClipboardList, Boxes, X } from "lucide-react";
import { NAV, isActivePath } from "./AdminShellNav";
import { LogoutButton } from "./LogoutButton";

const PRIMARY_LINKS = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/inventory", label: "Stock", icon: Boxes },
  { href: "/admin/products", label: "Products", icon: Package },
] as const;

export function AdminMobileNav({
  storeName,
  city,
}: {
  storeName: string;
  city: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 md:hidden"
        aria-label="Open admin menu"
        aria-expanded={open}
      >
        <Menu className="h-3.5 w-3.5" aria-hidden="true" />
        Menu
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45"
            aria-label="Close admin menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(88vw,360px)] flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">
                  {storeName}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{city} - Active</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                aria-label="Close admin menu"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3">
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
                    onClick={() => setOpen(false)}
                    className={`mb-1 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
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

            <div className="border-t border-slate-200 p-4">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 py-1.5 shadow-[0_-8px_20px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        {PRIMARY_LINKS.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium ${
                active ? "bg-blue-50 text-blue-700" : "text-slate-500"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium text-slate-500"
          aria-label="Open all admin sections"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          More
        </button>
      </nav>
    </>
  );
}
