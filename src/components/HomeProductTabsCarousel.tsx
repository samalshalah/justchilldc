"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/data";

export interface HomeProductTabGroup {
  id: string;
  label: string;
  href: string;
  count: number;
  products: Product[];
}

interface HomeProductTabsCarouselProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  groups: HomeProductTabGroup[];
}

export function HomeProductTabsCarousel({
  eyebrow,
  title,
  subtitle,
  groups,
}: HomeProductTabsCarouselProps) {
  const [activeId, setActiveId] = useState(groups[0]?.id ?? "");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const activeGroup = groups.find((group) => group.id === activeId) ?? groups[0];
  const products = activeGroup?.products ?? [];
  const sectionId = eyebrow.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const updateScrollState = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    setCanScrollPrev(scroller.scrollLeft > 4);
    setCanScrollNext(
      scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 4
    );
  };

  useEffect(() => {
    setActiveId((current) =>
      groups.some((group) => group.id === current) ? current : groups[0]?.id ?? ""
    );
  }, [groups]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollTo({ left: 0 });
    updateScrollState();
    scroller.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      scroller.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [activeGroup?.id, products.length]);

  const scrollByPage = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction * Math.max(scroller.clientWidth * 0.9, 300),
      behavior: "smooth",
    });
  };

  if (groups.length === 0 || !activeGroup) return null;

  return (
    <section
      className="border-y border-border/50 bg-card/25 py-12"
      data-home-product-section={sectionId}
    >
      <div className="container mx-auto px-4">
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              {eyebrow}
            </span>
            <h2 className="mt-2 text-2xl font-bold text-foreground md:text-4xl">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              {subtitle}
            </p>
          </div>
          <Link
            href={activeGroup.href}
            className="inline-flex items-center gap-2 text-sm font-bold text-foreground/85 transition-colors hover:text-accent"
          >
            Shop all {activeGroup.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {groups.map((group) => {
            const selected = group.id === activeGroup.id;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveId(group.id)}
                data-home-product-tab={group.id}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                  selected
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-background/70 text-foreground/80 hover:border-accent/60 hover:text-accent"
                }`}
                aria-pressed={selected}
              >
                {group.label}
                <span
                  className={`text-xs ${
                    selected ? "text-accent-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  {group.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <div
            ref={scrollerRef}
            className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.map((product, index) => (
              <div
                key={product.id}
                className="w-[78vw] max-w-[310px] shrink-0 snap-start sm:w-[44vw] lg:w-[230px] xl:w-[240px] 2xl:w-[286px]"
              >
                <ProductCard
                  product={product}
                  index={index}
                  priority={index < 2}
                  showDescription={false}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              disabled={!canScrollPrev}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-lg backdrop-blur transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`Previous ${title} products`}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              disabled={!canScrollNext}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-lg backdrop-blur transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`Next ${title} products`}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
