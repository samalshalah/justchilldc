/**
 * shop-config.ts — resolve effective shop page configuration.
 *
 * Settings can come from two places: the new `shop_config` slice (set
 * via Pages → Shop) or the older `menu_config` slice (still read for
 * backward compatibility). New keys win when both are set.
 */

import type { SiteSettings } from "./types";

export interface ResolvedShopConfig {
  h1: string;
  subtitle: string;
  layout: "sidebar" | "topbar" | "hybrid";
  sidebar: {
    showCategory: boolean;
    showStrain: boolean;
    showFeel: boolean;
    showBrand: boolean;
    showPrice: boolean;
    showInStockToggle: boolean;
  };
  card: {
    desktopColumns: 2 | 3 | 4 | 5;
    mobileColumns: 1 | 2;
    shape: "sharp" | "rounded" | "extra" | "pill";
    showCategory: boolean;
    showStrainBadge: boolean;
    showThcBadge: boolean;
    showSaleBadge: boolean;
    showDealBanner: boolean;
    badgePosition: "image" | "below" | "hidden";
    imageGradient: boolean;
  };
  pageSize: 24 | 48 | 96 | 0;
  showOos: boolean;
  showSearchBox: boolean;
  sortOptions: {
    featured: boolean;
    price_asc: boolean;
    price_desc: boolean;
    name_asc: boolean;
    name_desc: boolean;
  };
  defaultSort: "featured" | "price_asc" | "price_desc" | "name_asc" | "name_desc";
}

export function resolveShopConfig(settings: SiteSettings): ResolvedShopConfig {
  const sc = settings.shop_config ?? {};
  const mc = settings.menu_config ?? {};

  return {
    h1: sc.h1 ?? settings.seo?.page_shop?.h1 ?? "Our Menu",
    subtitle: sc.subtitle ?? settings.shop_page_subtitle ?? "",
    layout: sc.layout ?? "hybrid",
    sidebar: {
      showCategory: sc.sidebar_show_category ?? true,
      showStrain: sc.sidebar_show_strain ?? true,
      showFeel: sc.sidebar_show_feel ?? true,
      showBrand: sc.sidebar_show_brand ?? true,
      showPrice: sc.sidebar_show_price ?? true,
      showInStockToggle: sc.sidebar_show_in_stock_toggle ?? false,
    },
    card: {
      desktopColumns: (sc.desktop_columns ?? mc.columns ?? 3) as 2 | 3 | 4 | 5,
      mobileColumns: (sc.mobile_columns ?? mc.mobile_columns ?? 1) as 1 | 2,
      shape: sc.card_shape ?? mc.card_shape ?? "rounded",
      showCategory: sc.card_show_category ?? mc.show_category ?? true,
      showStrainBadge: sc.card_show_strain_badge ?? mc.show_strain_badge ?? true,
      showThcBadge: sc.card_show_thc_badge ?? mc.show_thc_badge ?? true,
      showSaleBadge: sc.card_show_sale_badge ?? mc.show_sale_badge ?? true,
      showDealBanner: sc.card_show_deal_banner ?? mc.show_deal_banner ?? true,
      badgePosition: sc.card_badge_position ?? mc.badge_position ?? "image",
      imageGradient:
        sc.card_image_gradient ??
        settings.theme_config?.product_image_gradient ??
        true,
    },
    pageSize: (sc.page_size ?? 24) as 24 | 48 | 96 | 0,
    showOos: sc.show_oos ?? mc.show_oos ?? false,
    showSearchBox: sc.show_search_box ?? mc.search_enabled ?? true,
    sortOptions: {
      featured: sc.sort_options?.featured ?? true,
      price_asc: sc.sort_options?.price_asc ?? true,
      price_desc: sc.sort_options?.price_desc ?? true,
      name_asc: sc.sort_options?.name_asc ?? true,
      name_desc: sc.sort_options?.name_desc ?? false,
    },
    defaultSort: sc.default_sort ?? "featured",
  };
}

export interface ResolvedPdpConfig {
  showSpecs: boolean;
  showEffects: boolean;
  showTerpenes: boolean;
  showFlavors: boolean;
  showTrustBadges: boolean;
  showRelated: boolean;
  relatedCount: number;
  relatedSource: "same_category" | "same_strain" | "featured" | "newest";
  showBreadcrumb: boolean;
  imageGalleryStyle: "single" | "stack";
}

export function resolvePdpConfig(settings: SiteSettings): ResolvedPdpConfig {
  const p = settings.pdp_config ?? {};
  return {
    showSpecs: p.show_specs ?? settings.pdp_show_specs ?? true,
    showEffects: p.show_effects ?? settings.pdp_show_effects ?? true,
    showTerpenes: p.show_terpenes ?? settings.pdp_show_terpenes ?? true,
    showFlavors: p.show_flavors ?? settings.pdp_show_flavors ?? true,
    showTrustBadges: p.show_trust_badges ?? settings.pdp_show_trust_badges ?? true,
    showRelated: p.show_related ?? settings.pdp_show_related ?? true,
    relatedCount: p.related_count ?? 3,
    relatedSource: p.related_source ?? "same_category",
    showBreadcrumb: p.show_breadcrumb ?? true,
    imageGalleryStyle: p.image_gallery_style ?? "single",
  };
}
