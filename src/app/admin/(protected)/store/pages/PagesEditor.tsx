"use client";

import { useState } from "react";
import { Home, ShoppingBag, Package, Info, Tag, MapPin, Mail } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { HomePageEditor } from "./_editors/HomePageEditor";
import { ShopPageEditor } from "./_editors/ShopPageEditor";
import { PdpEditor } from "./_editors/PdpEditor";
import { AboutPageEditor } from "./_editors/AboutPageEditor";
import { DealsPageEditor } from "./_editors/DealsPageEditor";
import { LocationPageEditor } from "./_editors/LocationPageEditor";
import { ContactPageEditor } from "./_editors/ContactPageEditor";

type PageId = "home" | "shop" | "pdp" | "about" | "deals" | "location" | "contact";

const PAGES: { id: PageId; label: string; icon: typeof Home; route: string }[] = [
  { id: "home", label: "Home page", icon: Home, route: "/" },
  { id: "shop", label: "Shop", icon: ShoppingBag, route: "/shop" },
  { id: "pdp", label: "Product page", icon: Package, route: "/product/[id]" },
  { id: "about", label: "About", icon: Info, route: "/about" },
  { id: "deals", label: "Deals", icon: Tag, route: "/deals" },
  { id: "location", label: "Location", icon: MapPin, route: "/location" },
  { id: "contact", label: "Contact", icon: Mail, route: "/contact" },
];

export function PagesEditor({ settings }: { settings: SiteSettings }) {
  const [active, setActive] = useState<PageId>("home");

  const activeMeta = PAGES.find((p) => p.id === active)!;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
      {/* Left rail: page picker */}
      <nav className="md:sticky md:top-6 md:self-start space-y-1">
        {PAGES.map((p) => {
          const Icon = p.icon;
          const isActive = active === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                isActive
                  ? "bg-amber-600/20 text-amber-400 border border-amber-700/50"
                  : "text-zinc-300 hover:bg-zinc-800 border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{p.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right pane: per-page editor */}
      <div className="min-w-0">
        <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold">{activeMeta.label}</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Edit visible page copy and layout. Business facts live under Business Info.
            </p>
          </div>
          <code className="text-xs text-zinc-500">{activeMeta.route}</code>
        </div>

        {active === "home" && <HomePageEditor settings={settings} />}
        {active === "shop" && <ShopPageEditor settings={settings} />}
        {active === "pdp" && <PdpEditor settings={settings} />}
        {active === "about" && <AboutPageEditor settings={settings} />}
        {active === "deals" && <DealsPageEditor settings={settings} />}
        {active === "location" && <LocationPageEditor settings={settings} />}
        {active === "contact" && <ContactPageEditor settings={settings} />}
      </div>
    </div>
  );
}
