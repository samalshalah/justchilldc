"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { saveSettingSlice } from "@/lib/admin-settings-client";
import { resolveShopConfig } from "@/lib/shop-config";
import { Field, Input, Textarea, Checkbox, Select } from "@/components/AdminFormControls";

type ShopConfig = NonNullable<SiteSettings["shop_config"]>;

export function ShopPageEditor({ settings }: { settings: SiteSettings }) {
  const initial = resolveShopConfig(settings);
  const [cfg, setCfg] = useState<ShopConfig>(() => ({
    h1: settings.shop_config?.h1 ?? initial.h1,
    subtitle: settings.shop_config?.subtitle ?? initial.subtitle,
    layout: settings.shop_config?.layout ?? initial.layout,
    sidebar_show_category:
      settings.shop_config?.sidebar_show_category ?? initial.sidebar.showCategory,
    sidebar_show_strain:
      settings.shop_config?.sidebar_show_strain ?? initial.sidebar.showStrain,
    sidebar_show_feel:
      settings.shop_config?.sidebar_show_feel ?? initial.sidebar.showFeel,
    sidebar_show_brand:
      settings.shop_config?.sidebar_show_brand ?? initial.sidebar.showBrand,
    sidebar_show_price:
      settings.shop_config?.sidebar_show_price ?? initial.sidebar.showPrice,
    sidebar_show_in_stock_toggle:
      settings.shop_config?.sidebar_show_in_stock_toggle ??
      initial.sidebar.showInStockToggle,
    desktop_columns:
      settings.shop_config?.desktop_columns ?? initial.card.desktopColumns,
    mobile_columns:
      settings.shop_config?.mobile_columns ?? initial.card.mobileColumns,
    card_shape: settings.shop_config?.card_shape ?? initial.card.shape,
    card_show_category:
      settings.shop_config?.card_show_category ?? initial.card.showCategory,
    card_show_strain_badge:
      settings.shop_config?.card_show_strain_badge ?? initial.card.showStrainBadge,
    card_show_thc_badge:
      settings.shop_config?.card_show_thc_badge ?? initial.card.showThcBadge,
    card_show_sale_badge:
      settings.shop_config?.card_show_sale_badge ?? initial.card.showSaleBadge,
    card_show_deal_banner:
      settings.shop_config?.card_show_deal_banner ?? initial.card.showDealBanner,
    card_badge_position:
      settings.shop_config?.card_badge_position ?? initial.card.badgePosition,
    card_image_gradient:
      settings.shop_config?.card_image_gradient ?? initial.card.imageGradient,
    page_size: settings.shop_config?.page_size ?? initial.pageSize,
    show_oos: settings.shop_config?.show_oos ?? initial.showOos,
    show_search_box:
      settings.shop_config?.show_search_box ?? initial.showSearchBox,
    sort_options: settings.shop_config?.sort_options ?? initial.sortOptions,
    default_sort: settings.shop_config?.default_sort ?? initial.defaultSort,
  }));

  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<ShopConfig>) => setCfg((c) => ({ ...c, ...patch }));

  const onSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveSettingSlice("shop_config", cfg);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  return (
    <div className="space-y-5">
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-zinc-200">Header copy</h3>
        <Field label="H1 (page heading)">
          <Input
            value={cfg.h1 ?? ""}
            onChange={(e) => update({ h1: e.target.value })}
            placeholder="Our Menu"
          />
        </Field>
        <Field label="Subtitle (small text under H1)">
          <Textarea
            rows={2}
            value={cfg.subtitle ?? ""}
            onChange={(e) => update({ subtitle: e.target.value })}
            placeholder="Curated products, simple ordering, local pickup."
          />
        </Field>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-zinc-200">Layout</h3>
        <Field
          label="Filter layout"
          hint="Hybrid: sidebar on desktop, drawer on mobile (recommended). Top-bar: dropdowns above the grid. Sidebar: always-visible sidebar (eats horizontal space)."
        >
          <Select
            value={cfg.layout ?? "hybrid"}
            onChange={(e) =>
              update({ layout: e.target.value as ShopConfig["layout"] })
            }
          >
            <option value="hybrid">Hybrid (sidebar desktop, drawer mobile)</option>
            <option value="sidebar">Sidebar (always visible)</option>
            <option value="topbar">Top-bar (dropdowns above grid)</option>
          </Select>
        </Field>

        <div className="pt-3 border-t border-zinc-800">
          <p className="text-sm font-medium text-zinc-300 mb-2">
            Sidebar / filter sections
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Checkbox
              label="Category filter"
              checked={cfg.sidebar_show_category ?? true}
              onChange={(e) =>
                update({ sidebar_show_category: e.target.checked })
              }
            />
            <Checkbox
              label="Strain filter"
              checked={cfg.sidebar_show_strain ?? true}
              onChange={(e) =>
                update({ sidebar_show_strain: e.target.checked })
              }
            />
            <Checkbox
              label="Feel filter"
              checked={cfg.sidebar_show_feel ?? true}
              onChange={(e) =>
                update({ sidebar_show_feel: e.target.checked })
              }
            />
            <Checkbox
              label="Brand filter"
              checked={cfg.sidebar_show_brand ?? true}
              onChange={(e) =>
                update({ sidebar_show_brand: e.target.checked })
              }
            />
            <Checkbox
              label="Price range slider"
              checked={cfg.sidebar_show_price ?? true}
              onChange={(e) =>
                update({ sidebar_show_price: e.target.checked })
              }
            />
            <Checkbox
              label="In-stock toggle"
              checked={cfg.sidebar_show_in_stock_toggle ?? false}
              onChange={(e) =>
                update({ sidebar_show_in_stock_toggle: e.target.checked })
              }
            />
            <Checkbox
              label="Search box"
              checked={cfg.show_search_box ?? true}
              onChange={(e) => update({ show_search_box: e.target.checked })}
            />
          </div>
        </div>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-zinc-200">Product cards</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cards per row (desktop)">
            <Select
              value={String(cfg.desktop_columns ?? 3)}
              onChange={(e) =>
                update({
                  desktop_columns: parseInt(e.target.value, 10) as 2 | 3 | 4 | 5,
                })
              }
            >
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </Select>
          </Field>
          <Field label="Cards per row (mobile)">
            <Select
              value={String(cfg.mobile_columns ?? 1)}
              onChange={(e) =>
                update({
                  mobile_columns: parseInt(e.target.value, 10) as 1 | 2,
                })
              }
            >
              <option value="1">1</option>
              <option value="2">2</option>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Card shape">
            <Select
              value={cfg.card_shape ?? "rounded"}
              onChange={(e) =>
                update({
                  card_shape: e.target.value as ShopConfig["card_shape"],
                })
              }
            >
              <option value="sharp">Sharp (small radius)</option>
              <option value="rounded">Rounded</option>
              <option value="extra">Extra rounded</option>
              <option value="pill">Pill</option>
            </Select>
          </Field>
          <Field label="Badge position">
            <Select
              value={cfg.card_badge_position ?? "image"}
              onChange={(e) =>
                update({
                  card_badge_position: e.target
                    .value as ShopConfig["card_badge_position"],
                })
              }
            >
              <option value="image">On the image</option>
              <option value="below">Below the name</option>
              <option value="hidden">Hidden</option>
            </Select>
          </Field>
        </div>
        <div className="pt-3 border-t border-zinc-800">
          <p className="text-sm font-medium text-zinc-300 mb-2">
            Card visibility
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Checkbox
              label="Category label"
              checked={cfg.card_show_category ?? true}
              onChange={(e) =>
                update({ card_show_category: e.target.checked })
              }
            />
            <Checkbox
              label="Strain badge (Indica/Sativa/Hybrid)"
              checked={cfg.card_show_strain_badge ?? true}
              onChange={(e) =>
                update({ card_show_strain_badge: e.target.checked })
              }
            />
            <Checkbox
              label="THC badge"
              checked={cfg.card_show_thc_badge ?? true}
              onChange={(e) =>
                update({ card_show_thc_badge: e.target.checked })
              }
            />
            <Checkbox
              label="Sale badge (when on sale)"
              checked={cfg.card_show_sale_badge ?? true}
              onChange={(e) =>
                update({ card_show_sale_badge: e.target.checked })
              }
            />
            <Checkbox
              label="Deal banner (upsell)"
              checked={cfg.card_show_deal_banner ?? true}
              onChange={(e) =>
                update({ card_show_deal_banner: e.target.checked })
              }
            />
            <Checkbox
              label="Product image dark overlay"
              checked={cfg.card_image_gradient ?? true}
              onChange={(e) =>
                update({ card_image_gradient: e.target.checked })
              }
            />
          </div>
        </div>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-zinc-200">Pagination &amp; results</h3>
        <Field label="Products per page">
          <Select
            value={String(cfg.page_size ?? 24)}
            onChange={(e) =>
              update({
                page_size: parseInt(e.target.value, 10) as 24 | 48 | 96 | 0,
              })
            }
          >
            <option value="24">24 per page</option>
            <option value="48">48 per page</option>
            <option value="96">96 per page</option>
            <option value="0">Show all (no pagination)</option>
          </Select>
        </Field>
        <Checkbox
          label="Show out-of-stock products"
          checked={cfg.show_oos ?? false}
          onChange={(e) => update({ show_oos: e.target.checked })}
        />
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-zinc-200">Sort options</h3>
        <p className="text-xs text-zinc-500">
          Pick which sort options appear in the dropdown.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Checkbox
            label="Featured first"
            checked={cfg.sort_options?.featured ?? true}
            onChange={(e) =>
              update({
                sort_options: {
                  ...(cfg.sort_options ?? {}),
                  featured: e.target.checked,
                },
              })
            }
          />
          <Checkbox
            label="Price: low to high"
            checked={cfg.sort_options?.price_asc ?? true}
            onChange={(e) =>
              update({
                sort_options: {
                  ...(cfg.sort_options ?? {}),
                  price_asc: e.target.checked,
                },
              })
            }
          />
          <Checkbox
            label="Price: high to low"
            checked={cfg.sort_options?.price_desc ?? true}
            onChange={(e) =>
              update({
                sort_options: {
                  ...(cfg.sort_options ?? {}),
                  price_desc: e.target.checked,
                },
              })
            }
          />
          <Checkbox
            label="Name: A → Z"
            checked={cfg.sort_options?.name_asc ?? true}
            onChange={(e) =>
              update({
                sort_options: {
                  ...(cfg.sort_options ?? {}),
                  name_asc: e.target.checked,
                },
              })
            }
          />
          <Checkbox
            label="Name: Z → A"
            checked={cfg.sort_options?.name_desc ?? false}
            onChange={(e) =>
              update({
                sort_options: {
                  ...(cfg.sort_options ?? {}),
                  name_desc: e.target.checked,
                },
              })
            }
          />
        </div>
        <Field label="Default sort">
          <Select
            value={cfg.default_sort ?? "featured"}
            onChange={(e) =>
              update({
                default_sort: e.target.value as ShopConfig["default_sort"],
              })
            }
          >
            <option value="featured">Featured</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="name_asc">Name: A → Z</option>
            <option value="name_desc">Name: Z → A</option>
          </Select>
        </Field>
      </section>

      <SaveBar pending={pending} saved={saved} error={error} onSave={onSave} />
    </div>
  );
}

function SaveBar({
  pending,
  saved,
  error,
  onSave,
}: {
  pending: boolean;
  saved: boolean;
  error: string | null;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-3 sticky bottom-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 -mx-6 -mb-6 px-6 py-4 mt-6">
      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg disabled:opacity-60"
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        Save changes
      </button>
      {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
      {error && <span className="text-sm text-red-400">{error}</span>}
    </div>
  );
}
