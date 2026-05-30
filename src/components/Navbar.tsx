"use client";

import { Fragment, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ChevronDown, Leaf, Menu, X, ShoppingBag, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "./CartContext";
import { useSettings } from "./SettingsProvider";
import { DEFAULTS } from "@/lib/defaults";
import { isStorageImageUrl } from "@/lib/images";

const DEFAULT_NAV_LINKS = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Deals", path: "/deals" },
  { name: "Location", path: "/location" },
  { name: "Contact", path: "/contact" },
];

const RESOURCE_LINKS = [
  {
    name: "Blog",
    path: "/blog",
    description: "Store updates, product education, and local guides.",
  },
  {
    name: "FAQs",
    path: "/faqs",
    description: "Quick answers about ordering, pickup, and shopping.",
  },
];

type ShopNavItem = {
  name: string;
  href: string;
  count?: number;
};

export interface ShopNavData {
  categories: ShopNavItem[];
  brands: ShopNavItem[];
  strains: ShopNavItem[];
  feelings: ShopNavItem[];
}

export function Navbar({ shopNav }: { shopNav?: ShopNavData }) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [resourcesMenuOpen, setResourcesMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const settings = useSettings();

  const isLightTheme = (settings.theme_config?.mode ?? "dark") === "light";
  const logoSrc = isLightTheme
    ? settings.store?.logo_dark || settings.store?.logo_light
    : settings.store?.logo_light;
  const logoImageUrl = logoSrc ? `/api/storage${logoSrc}` : null;
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const megaImageUrl = settings.homepage_sections?.hero?.bannerImageUrl
    ? `/api/storage${settings.homepage_sections.hero.bannerImageUrl}`
    : "/images/store/store-interior-mural.webp";

  const headerCfg = settings.header_config;
  const showCta = headerCfg?.show_cta ?? false;
  const ctaText = headerCfg?.cta_text || "Order Now";
  const ctaLink = headerCfg?.cta_link || "/shop";
  const logoSize = headerCfg?.logo_size ?? 40;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = DEFAULT_NAV_LINKS;
  const isShopActive = pathname.startsWith("/shop");
  const isResourcesActive =
    pathname.startsWith("/blog") || pathname.startsWith("/faqs");
  const hasShopMenu =
    !!shopNav &&
    (shopNav.categories.length > 0 ||
      shopNav.brands.length > 0 ||
      shopNav.strains.length > 0 ||
      shopNav.feelings.length > 0);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-xl transition-all duration-300 ${
        isScrolled ? "py-3 shadow-2xl shadow-black/20" : "py-4"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 font-display text-xl font-bold text-foreground"
        >
          {logoSrc ? (
            <Image
              src={logoImageUrl!}
              alt={storeName}
              width={logoSize}
              height={logoSize}
              unoptimized={isStorageImageUrl(logoImageUrl)}
              className="max-h-12 object-contain brightness-0 invert"
              priority
            />
          ) : (
            <Leaf className="h-6 w-6 text-white" aria-hidden="true" />
          )}
          <span className={logoSrc ? "sr-only" : "truncate"}>{storeName}</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <div
            onMouseEnter={() => {
              setShopMenuOpen(true);
              setResourcesMenuOpen(false);
            }}
          >
            <button
              type="button"
              onClick={() => setShopMenuOpen((open) => !open)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition-colors hover:border-accent/60 hover:text-accent ${
                isShopActive
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-border/70 bg-card/70 text-foreground/90"
              }`}
              aria-expanded={shopMenuOpen}
              aria-haspopup="menu"
            >
              Shop Cannabis
              <ChevronDown
                className={`h-4 w-4 transition-transform ${shopMenuOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
          </div>
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Fragment key={link.path}>
                {link.path === "/contact" && (
                  <div
                    onMouseEnter={() => {
                      setResourcesMenuOpen(true);
                      setShopMenuOpen(false);
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setResourcesMenuOpen((open) => !open)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-card/80 hover:text-accent ${
                        isResourcesActive ? "text-accent" : "text-foreground/80"
                      }`}
                      aria-expanded={resourcesMenuOpen}
                      aria-haspopup="menu"
                    >
                      Resources
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${resourcesMenuOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                )}
                <Link
                  href={link.path}
                  onMouseEnter={() => {
                    setShopMenuOpen(false);
                    setResourcesMenuOpen(false);
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-card/80 hover:text-accent ${
                    isActive ? "text-accent" : "text-foreground/80"
                  }`}
                >
                  {link.name}
                </Link>
              </Fragment>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {showCta && (
            <Link
              href={ctaLink}
              className="hidden sm:inline-flex px-4 py-2 bg-accent text-accent-foreground font-semibold rounded-full text-sm hover:bg-accent/90 transition-colors"
            >
              {ctaText}
            </Link>
          )}

          <Link
            href="/shop"
            aria-label="Search products"
            className="hidden h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-foreground transition-colors hover:border-accent/60 hover:text-accent sm:inline-flex"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </Link>

          <Link
            href="/checkout"
            aria-label={`Cart, ${totalItems} items`}
            className="relative inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border/70 bg-card/70 px-3 text-sm font-bold text-foreground transition-colors hover:border-accent/60 hover:text-accent"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart ({totalItems})</span>
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground sm:hidden">
                {totalItems}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-full bg-card border border-border/50 flex items-center justify-center text-foreground"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {shopMenuOpen && hasShopMenu && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            onMouseEnter={() => setShopMenuOpen(true)}
            onMouseLeave={() => setShopMenuOpen(false)}
            className="absolute left-1/2 top-full hidden w-[min(1040px,calc(100vw-2rem))] -translate-x-1/2 pt-2 md:block"
          >
            <div className="rounded-lg border border-border bg-background/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="grid grid-cols-[1.25fr_1fr_1fr_1fr] gap-6">
                <div>
                  <Link
                    href="/shop"
                    onClick={() => setShopMenuOpen(false)}
                    className="group relative mb-4 block h-36 overflow-hidden rounded-md border border-border/70 bg-card transition-colors hover:border-accent"
                  >
                    <Image
                      src={megaImageUrl}
                      alt=""
                      fill
                      sizes="280px"
                      unoptimized={isStorageImageUrl(megaImageUrl)}
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="font-bold text-white">Shop all products</p>
                      <p className="mt-1 text-sm text-white/75">
                        Browse the full menu with filters.
                      </p>
                    </div>
                  </Link>
                  <MenuGroup title="Categories" items={shopNav?.categories ?? []} onClick={() => setShopMenuOpen(false)} />
                </div>
                <MenuGroup title="Brands" items={shopNav?.brands ?? []} onClick={() => setShopMenuOpen(false)} />
                <MenuGroup title="Strain Types" items={shopNav?.strains ?? []} onClick={() => setShopMenuOpen(false)} />
                <MenuGroup title="Shop by Feel" items={shopNav?.feelings ?? []} onClick={() => setShopMenuOpen(false)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resourcesMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            onMouseEnter={() => setResourcesMenuOpen(true)}
            onMouseLeave={() => setResourcesMenuOpen(false)}
            className="absolute left-1/2 top-full hidden w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 pt-2 md:block"
          >
            <div className="rounded-lg border border-border bg-background/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="space-y-1">
                {RESOURCE_LINKS.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setResourcesMenuOpen(false)}
                    className="block rounded-md px-3 py-3 transition-colors hover:bg-card hover:text-accent"
                  >
                    <span className="block text-sm font-bold text-foreground">
                      {link.name}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                      {link.description}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/50"
          >
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-foreground hover:text-accent transition-colors"
              >
                Shop Cannabis
              </Link>
              {hasShopMenu && (
                <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card/50 p-4">
                  <MobileMenuGroup title="Categories" items={shopNav?.categories ?? []} onClick={() => setMobileMenuOpen(false)} />
                  <MobileMenuGroup title="Brands" items={shopNav?.brands ?? []} onClick={() => setMobileMenuOpen(false)} />
                  <MobileMenuGroup title="Strains" items={shopNav?.strains ?? []} onClick={() => setMobileMenuOpen(false)} />
                  <MobileMenuGroup title="Feel" items={shopNav?.feelings ?? []} onClick={() => setMobileMenuOpen(false)} />
                </div>
              )}
              {navLinks.map((link) => (
                <Fragment key={link.path}>
                  {link.path === "/contact" && (
                    <div className="rounded-2xl border border-border bg-card/50 p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Resources
                      </p>
                      <div className="space-y-2">
                        {RESOURCE_LINKS.map((resourceLink) => (
                          <Link
                            key={resourceLink.path}
                            href={resourceLink.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block text-lg font-medium text-foreground hover:text-accent transition-colors"
                          >
                            {resourceLink.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  <Link
                    href={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-medium text-foreground hover:text-accent transition-colors"
                  >
                    {link.name}
                  </Link>
                </Fragment>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MenuGroup({
  title,
  items,
  onClick,
}: {
  title: string;
  items: ShopNavItem[];
  onClick: () => void;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1.5">
        {items.slice(0, 8).map((item) => (
          <Link
            key={`${title}-${item.href}`}
            href={item.href}
            onClick={onClick}
            className="group flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm font-semibold text-foreground/85 transition-colors hover:bg-card hover:text-accent"
          >
            <span className="truncate">{item.name}</span>
            {typeof item.count === "number" && (
              <span className="text-xs text-muted-foreground group-hover:text-accent">
                {item.count}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

function MobileMenuGroup({
  title,
  items,
  onClick,
}: {
  title: string;
  items: ShopNavItem[];
  onClick: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1">
        {items.slice(0, 5).map((item) => (
          <Link
            key={`${title}-${item.href}`}
            href={item.href}
            onClick={onClick}
            className="block truncate text-sm text-foreground/80 hover:text-accent"
          >
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
