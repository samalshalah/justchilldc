"use client";

import { useMemo, useState, useEffect, useCallback, useId, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, Filter, ChevronDown } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product, Category, Brand } from "@/lib/data";
import type { ResolvedShopConfig } from "@/lib/shop-config";
import {
  STRAIN_TYPES,
  getAvailableFeelings,
  getProductFeelings,
  type StrainFilter,
} from "@/lib/product-facets";
import { comparePackageSizes } from "@/lib/product-size";

type SortId = "featured" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

const SORT_LABELS: Record<SortId, string> = {
  featured: "Featured",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  name_asc: "Name: A to Z",
  name_desc: "Name: Z to A",
};

interface ShopClientProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  initialCategory?: string;
  initialStrain?: string;
  initialEffect?: string;
  initialBrand?: string;
  initialSize?: string;
  initialSearch?: string;
  initialSort?: string;
  initialPage?: number;
  initialMinPrice?: number;
  initialMaxPrice?: number;
  config: ResolvedShopConfig;
}

function getColsClass(desktop: number, mobile: number): string {
  const mob = mobile === 2 ? "grid-cols-2" : "grid-cols-1";
  const map: Record<number, string> = {
    2: `${mob} sm:grid-cols-2`,
    3: `${mob} sm:grid-cols-2 lg:grid-cols-3`,
    4: `${mob} sm:grid-cols-2 lg:grid-cols-4`,
    5: `${mob} sm:grid-cols-2 lg:grid-cols-5`,
  };
  return map[desktop] ?? map[3];
}

export function ShopClient({
  products,
  categories,
  brands,
  initialCategory,
  initialStrain,
  initialEffect,
  initialBrand,
  initialSize,
  initialSearch,
  initialSort,
  initialPage,
  initialMinPrice,
  initialMaxPrice,
  config,
}: ShopClientProps) {
  const searchParams = useSearchParams();
  const applyingUrlStateRef = useRef(false);
  const [search, setSearch] = useState(initialSearch ?? "");
  const [category, setCategory] = useState<string>(initialCategory ?? "All");
  const [strain, setStrain] = useState<StrainFilter>(
    (initialStrain as StrainFilter) ?? "All"
  );
  const [effect, setEffect] = useState<string>(initialEffect ?? "All");
  const [brand, setBrand] = useState<number | "All">(
    initialBrand ? Number(initialBrand) : "All"
  );
  const [size, setSize] = useState<string>(initialSize ?? "All");
  const [sortBy, setSortBy] = useState<SortId>(
    (initialSort as SortId) ?? config.defaultSort
  );
  const [page, setPage] = useState<number>(initialPage ?? 1);
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  const allPrices = useMemo(
    () => products.map((p) => p.salePrice ?? p.price),
    [products]
  );
  const priceMin = useMemo(
    () => (allPrices.length ? Math.min(...allPrices) : 0),
    [allPrices]
  );
  const priceMax = useMemo(
    () => (allPrices.length ? Math.max(...allPrices) : 200),
    [allPrices]
  );
  const [minPrice, setMinPrice] = useState<number>(initialMinPrice ?? priceMin);
  const [maxPrice, setMaxPrice] = useState<number>(initialMaxPrice ?? priceMax);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const availableFeelings = useMemo(() => getAvailableFeelings(products), [products]);
  const availableSizes = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.weight?.trim())
            .filter((value): value is string => Boolean(value))
        )
      ).sort(comparePackageSizes),
    [products]
  );
  const queryKey = searchParams.toString();

  useEffect(() => {
    applyingUrlStateRef.current = true;

    const nextCategory = searchParams.get("category") ?? initialCategory ?? "All";
    const nextStrain = (searchParams.get("strain") ?? "All") as StrainFilter;
    const nextEffect = searchParams.get("effect") ?? "All";
    const nextSize = searchParams.get("size") ?? initialSize ?? "All";
    const brandParam = searchParams.get("brand");
    const parsedBrand = brandParam ? Number(brandParam) : NaN;
    const nextBrand: number | "All" = Number.isFinite(parsedBrand)
      ? parsedBrand
      : "All";
    const nextSearch = searchParams.get("q") ?? "";
    const sortParam = searchParams.get("sort") as SortId | null;
    const nextSort = sortParam && sortParam in SORT_LABELS
      ? sortParam
      : config.defaultSort;
    const pageParam = parseInt(searchParams.get("page") ?? "1", 10);
    const minParam = searchParams.get("minPrice");
    const maxParam = searchParams.get("maxPrice");
    const nextMinPrice = minParam ? parseInt(minParam, 10) : priceMin;
    const nextMaxPrice = maxParam ? parseInt(maxParam, 10) : priceMax;

    setCategory(nextCategory);
    setStrain(nextStrain);
    setEffect(nextEffect);
    setSize(nextSize);
    setBrand(nextBrand);
    setSearch(nextSearch);
    setSortBy(nextSort);
    setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
    setMinPrice(Number.isFinite(nextMinPrice) ? nextMinPrice : priceMin);
    setMaxPrice(Number.isFinite(nextMaxPrice) ? nextMaxPrice : priceMax);
  }, [
    queryKey,
    initialCategory,
    initialSize,
    config.defaultSort,
    priceMin,
    priceMax,
    searchParams,
  ]);

  const filtered = useMemo(() => {
    let result = products;

    if (!config.showOos || showInStockOnly) {
      result = result.filter((p) => p.inStock);
    }
    if (category !== "All") result = result.filter((p) => p.category === category);
    if (strain !== "All") result = result.filter((p) => p.strain === strain);
    if (effect !== "All") {
      result = result.filter((p) => getProductFeelings(p).includes(effect));
    }
    if (brand !== "All") result = result.filter((p) => p.brandId === brand);
    if (size !== "All") result = result.filter((p) => p.weight === size);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          getProductFeelings(p).some((feeling) => feeling.toLowerCase().includes(q))
      );
    }
    if (config.sidebar.showPrice) {
      result = result.filter((p) => {
        const price = p.salePrice ?? p.price;
        return price >= minPrice && price <= maxPrice;
      });
    }

    switch (sortBy) {
      case "price_asc":
        return [...result].sort(
          (a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price)
        );
      case "price_desc":
        return [...result].sort(
          (a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price)
        );
      case "name_asc":
        return [...result].sort((a, b) => a.name.localeCompare(b.name));
      case "name_desc":
        return [...result].sort((a, b) => b.name.localeCompare(a.name));
      case "featured":
      default:
        return [...result].sort((a, b) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return 0;
        });
    }
  }, [
    products,
    category,
    strain,
    effect,
    brand,
    size,
    search,
    sortBy,
    showInStockOnly,
    config.showOos,
    config.sidebar.showPrice,
    minPrice,
    maxPrice,
  ]);

  useEffect(() => {
    setPage(1);
  }, [category, strain, effect, brand, size, search, sortBy, minPrice, maxPrice, showInStockOnly]);

  const pageSize = config.pageSize;
  const usePagination = pageSize > 0;
  const totalPages = usePagination ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const visible = usePagination
    ? filtered.slice((page - 1) * pageSize, page * pageSize)
    : filtered;

  const syncUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    if (strain !== "All") params.set("strain", strain);
    if (effect !== "All") params.set("effect", effect);
    if (brand !== "All") params.set("brand", String(brand));
    if (size !== "All") params.set("size", size);
    if (search.trim()) params.set("q", search.trim());
    if (sortBy !== config.defaultSort) params.set("sort", sortBy);
    if (page > 1) params.set("page", String(page));
    if (config.sidebar.showPrice && minPrice > priceMin)
      params.set("minPrice", String(minPrice));
    if (config.sidebar.showPrice && maxPrice < priceMax)
      params.set("maxPrice", String(maxPrice));
    const qs = params.toString();
    const url = qs ? `/shop?${qs}` : "/shop";
    window.history.replaceState({}, "", url);
  }, [category, strain, effect, brand, size, search, sortBy, page, minPrice, maxPrice, priceMin, priceMax, config.defaultSort, config.sidebar.showPrice]);

  useEffect(() => {
    if (applyingUrlStateRef.current) {
      applyingUrlStateRef.current = false;
      return;
    }

    syncUrl();
  }, [syncUrl]);

  const hasActiveFilters =
    category !== "All" ||
    strain !== "All" ||
    effect !== "All" ||
    brand !== "All" ||
    size !== "All" ||
    search.trim() !== "" ||
    showInStockOnly ||
    (config.sidebar.showPrice && (minPrice > priceMin || maxPrice < priceMax));

  const clearAll = () => {
    setCategory("All");
    setStrain("All");
    setEffect("All");
    setBrand("All");
    setSize("All");
    setSearch("");
    setShowInStockOnly(false);
    setMinPrice(priceMin);
    setMaxPrice(priceMax);
  };

  const useSidebar = config.layout === "sidebar" || config.layout === "hybrid";

  const sortIds = (Object.keys(config.sortOptions) as SortId[]).filter(
    (k) => config.sortOptions[k]
  );

  const sidebar = (
    <div className="space-y-6">
      {config.sidebar.showCategory && (
        <FilterGroup title="Category">
          <FilterRadio
            name="cat"
            value="All"
            current={category}
            onChange={setCategory}
            label="All categories"
          />
          {categories.map((c) => (
            <FilterRadio
              key={c.id}
              name="cat"
              value={c.name}
              current={category}
              onChange={setCategory}
              label={c.name}
            />
          ))}
        </FilterGroup>
      )}

      {config.sidebar.showStrain && (
        <FilterGroup title="Strain">
          {STRAIN_TYPES.map((s) => (
            <FilterRadio
              key={s}
              name="strain"
              value={s}
              current={strain}
              onChange={(v) => setStrain(v as StrainFilter)}
              label={s === "All" ? "All strains" : s}
            />
          ))}
        </FilterGroup>
      )}

      {config.sidebar.showFeel && availableFeelings.length > 0 && (
        <FilterGroup title="Feel">
          <FilterRadio
            name="effect"
            value="All"
            current={effect}
            onChange={setEffect}
            label="All feelings"
          />
          {availableFeelings.map((feeling) => (
            <FilterRadio
              key={feeling}
              name="effect"
              value={feeling}
              current={effect}
              onChange={setEffect}
              label={feeling}
            />
          ))}
        </FilterGroup>
      )}

      {config.sidebar.showBrand && brands.length > 0 && (
        <FilterGroup title="Brand">
          <FilterRadio
            name="brand"
            value="All"
            current={String(brand)}
            onChange={() => setBrand("All")}
            label="All brands"
          />
          {brands.map((b) => (
            <FilterRadio
              key={b.id}
              name="brand"
              value={String(b.id)}
              current={String(brand)}
              onChange={(v) => setBrand(Number(v))}
              label={b.name}
            />
          ))}
        </FilterGroup>
      )}

      {availableSizes.length > 0 && (
        <FilterGroup title="Size">
          <FilterRadio
            name="size"
            value="All"
            current={size}
            onChange={setSize}
            label="All sizes"
          />
          {availableSizes.map((option) => (
            <FilterRadio
              key={option}
              name="size"
              value={option}
              current={size}
              onChange={setSize}
              label={option}
            />
          ))}
        </FilterGroup>
      )}

      {config.sidebar.showPrice && priceMax > priceMin && (
        <FilterGroup title="Price">
          <div className="px-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>${minPrice}</span>
              <span>${maxPrice}</span>
            </div>
            <input
              type="range"
              min={priceMin}
              max={priceMax}
              value={minPrice}
              onChange={(e) =>
                setMinPrice(Math.min(parseInt(e.target.value, 10), maxPrice))
              }
              className="w-full accent-accent"
              aria-label="Minimum price"
            />
            <input
              type="range"
              min={priceMin}
              max={priceMax}
              value={maxPrice}
              onChange={(e) =>
                setMaxPrice(Math.max(parseInt(e.target.value, 10), minPrice))
              }
              className="w-full accent-accent"
              aria-label="Maximum price"
            />
          </div>
        </FilterGroup>
      )}

      {config.sidebar.showInStockToggle && config.showOos && (
        <FilterGroup title="Availability">
          <label className="flex items-center gap-2 text-sm text-foreground/80 cursor-pointer">
            <input
              type="checkbox"
              checked={showInStockOnly}
              onChange={(e) => setShowInStockOnly(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-accent"
            />
            In stock only
          </label>
        </FilterGroup>
      )}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-muted-foreground hover:text-foreground hover:border-accent transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" /> Clear all filters
        </button>
      )}
    </div>
  );

  const cols = getColsClass(config.card.desktopColumns, config.card.mobileColumns);

  return (
    <section className="py-10 bg-background min-h-[60vh]">
      <div className="container mx-auto px-4">
        <div
          className={
            useSidebar ? "grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8" : ""
          }
        >
          {useSidebar && (
            <aside className="hidden lg:block sticky top-24 self-start">
              {sidebar}
            </aside>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {useSidebar && config.layout !== "topbar" && (
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-border text-sm hover:border-accent"
                >
                  <Filter className="w-4 h-4" /> Filters
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-accent" />
                  )}
                </button>
              )}

              {config.layout === "topbar" && (
                <>
                  {config.sidebar.showCategory && (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="appearance-none bg-card border border-border rounded-full py-2 px-4 text-sm text-foreground focus:outline-none focus:border-accent"
                    >
                      <option value="All">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {config.sidebar.showStrain && (
                    <select
                      value={strain}
                      onChange={(e) => setStrain(e.target.value as StrainFilter)}
                      className="appearance-none bg-card border border-border rounded-full py-2 px-4 text-sm text-foreground focus:outline-none focus:border-accent"
                    >
                      {STRAIN_TYPES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  )}
                  {config.sidebar.showBrand && brands.length > 0 && (
                    <select
                      value={String(brand)}
                      onChange={(e) =>
                        setBrand(e.target.value === "All" ? "All" : Number(e.target.value))
                      }
                      className="appearance-none bg-card border border-border rounded-full py-2 px-4 text-sm text-foreground focus:outline-none focus:border-accent"
                    >
                      <option value="All">All Brands</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {config.sidebar.showFeel && availableFeelings.length > 0 && (
                    <select
                      value={effect}
                      onChange={(e) => setEffect(e.target.value)}
                      className="appearance-none bg-card border border-border rounded-full py-2 px-4 text-sm text-foreground focus:outline-none focus:border-accent"
                    >
                      <option value="All">All Feelings</option>
                      {availableFeelings.map((feeling) => (
                        <option key={feeling} value={feeling}>
                          {feeling}
                        </option>
                      ))}
                    </select>
                  )}
                  {availableSizes.length > 0 && (
                    <select
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="appearance-none bg-card border border-border rounded-full py-2 px-4 text-sm text-foreground focus:outline-none focus:border-accent"
                    >
                      <option value="All">All Sizes</option>
                      {availableSizes.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}

              {config.showSearchBox && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products"
                    className="pl-9 pr-4 py-2 rounded-full bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              )}

              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden md:inline">
                  {filtered.length} {filtered.length === 1 ? "product" : "products"}
                </span>
                {sortIds.length > 0 && (
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortId)}
                    className="appearance-none bg-card border border-border rounded-full py-2 px-4 text-sm text-foreground focus:outline-none focus:border-accent cursor-pointer"
                    aria-label="Sort"
                  >
                    {sortIds.map((id) => (
                      <option key={id} value={id}>
                        Sort: {SORT_LABELS[id]}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground mb-4">
                  No products match those filters.
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="px-5 py-2 rounded-full bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className={`grid ${cols} gap-6`}>
                  {visible.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                      priority={index < 4}
                    />
                  ))}
                </div>

                {usePagination && totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onChange={setPage}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {drawerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 lg:hidden"
            onClick={() => setDrawerOpen(false)}
          >
            <div
              className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-background border-l border-border overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold">Filters</h2>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 hover:bg-card rounded-lg"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">{sidebar}</div>
              <div className="p-4 border-t border-border sticky bottom-0 bg-background">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="w-full py-3 bg-accent text-accent-foreground rounded-full font-semibold"
                >
                  Show {filtered.length} product{filtered.length === 1 ? "" : "s"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const id = useId();
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="w-full flex items-center justify-between cursor-pointer mb-2"
      >
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div id={id} className="space-y-1.5 pl-1">
          {children}
        </div>
      )}
    </div>
  );
}

function FilterRadio({
  name,
  value,
  current,
  onChange,
  label,
}: {
  name: string;
  value: string;
  current: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const isActive = value === current;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      aria-label={label}
      data-group={name}
      onClick={() => onChange(value)}
      className={`flex items-center gap-2 text-sm w-full text-left cursor-pointer transition-colors ${
        isActive ? "text-foreground" : "text-foreground/70 hover:text-foreground"
      }`}
    >
      <span
        className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
          isActive
            ? "border-accent bg-accent"
            : "border-border bg-transparent"
        }`}
        aria-hidden="true"
      >
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground" />
        )}
      </span>
      <span className={isActive ? "font-medium" : ""}>{label}</span>
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages: (number | "...")[] = [];
  const add = (p: number | "...") => pages.push(p);
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) add(i);
  } else {
    add(1);
    if (page > 3) add("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      add(i);
    }
    if (page < totalPages - 2) add("...");
    add(totalPages);
  }

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-1 flex-wrap"
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Prev
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} className="px-2 text-muted-foreground">
            &hellip;
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`min-w-[36px] px-3 py-1.5 rounded-lg text-sm border ${
              p === page
                ? "border-accent bg-accent text-accent-foreground font-semibold"
                : "border-border bg-card hover:border-accent"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </nav>
  );
}
