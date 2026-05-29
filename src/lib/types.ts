/**
 * SiteSettings — typed shape of every key that lives in the `site_settings` table.
 *
 * This file deliberately has zero React imports so it can be used from
 * Server Components, Route Handlers, and the admin write path.
 *
 * Note: the legacy app split this into 20+ optional interfaces with
 * sub-properties scattered throughout. We keep the same shape here so
 * the existing admin pages port over without translation, but every
 * top-level key is also independently parseable so the cache layer
 * can read/write them one at a time.
 */

import type { ThemeConfig } from "./theme";

export type DealType =
  | "spend_threshold"
  | "bogo"
  | "quantity_break"
  | "day_of_week"
  | "site_wide";

export interface DealRule {
  id: string;
  type: DealType;
  enabled: boolean;
  name: string;
  discountType?: "percent" | "flat";
  discountValue?: number;
  threshold?: number;
  buyQty?: number;
  getQty?: number;
  minQty?: number;
  /** Recurring day-of-week filter. Empty/undefined = every day. 0=Sun..6=Sat. */
  days?: number[];
  /** Optional start date (ISO YYYY-MM-DD). Deal inactive before this date. */
  startDate?: string;
  /** Optional end date (ISO YYYY-MM-DD, inclusive). Deal inactive after this date. */
  endDate?: string;
}

export interface HomepageSection {
  visible?: boolean;
  label?: string;
  title?: string;
  subtitle?: string;
}

export interface HeaderConfig {
  show_cta: boolean;
  cta_text: string;
  cta_link: string;
  logo_size: number;
}

export interface FooterConfig {
  show_quick_links: boolean;
  show_categories: boolean;
  show_contact: boolean;
  show_social: boolean;
  show_disclaimer: boolean;
}

export interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
}
export type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface StoreHoursConfig {
  temporarily_closed?: boolean;
  closed_message?: string;
  show_on_website?: boolean;
  schedule?: Record<WeekDay, DaySchedule>;
}

export interface OrderingConfig {
  pickup_enabled?: boolean;
  pickup_min_order?: number;
  pickup_prep_time?: number;
  pickup_instructions?: string;
  delivery_enabled?: boolean;
  delivery_min_order?: number;
  delivery_radius?: number;
  delivery_fee?: number;
  delivery_instructions?: string;
  pause_all_orders?: boolean;
  order_notes_enabled?: boolean;
}

export interface MenuConfig {
  default_sort?: "new" | "price_asc" | "price_desc" | "name" | "popular";
  show_oos?: boolean;
  search_enabled?: boolean;
  filter_category?: boolean;
  filter_strain?: boolean;
  filter_brand?: boolean;
  show_strain_badge?: boolean;
  show_thc_badge?: boolean;
  show_category?: boolean;
  show_sale_badge?: boolean;
  show_deal_banner?: boolean;
  badge_position?: "image" | "below" | "hidden";
  card_shape?: "sharp" | "rounded" | "extra" | "pill";
  columns?: 2 | 3 | 4 | 5;
  mobile_columns?: 1 | 2;
  rows?: number;
}

export interface CheckoutConfig {
  require_name?: boolean;
  require_email?: boolean;
  require_phone?: boolean;
  guest_checkout?: boolean;
  order_notes?: boolean;
  tipping_enabled?: boolean;
  tip_presets?: number[];
  promo_codes_enabled?: boolean;
  min_order_amount?: number;
  payment_cash?: boolean;
  terms_required?: boolean;
  terms_text?: string;
}

export interface PageSeoConfig {
  title?: string;
  description?: string;
  h1?: string;
}

export interface SeoConfig {
  title_template?: string;
  meta_description?: string;
  og_image?: string;
  robots_noindex?: boolean;
  auto_structured_data?: boolean;
  google_site_verification?: string;
  canonical_domain?: string;
  city?: string;
  page_home?: PageSeoConfig;
  page_shop?: PageSeoConfig;
  page_product?: PageSeoConfig;
  page_category?: PageSeoConfig;
  page_brand?: PageSeoConfig;
  page_blog?: PageSeoConfig;
}

export interface StoreConfig {
  name?: string;
  tagline?: string;
  footer_text?: string;
  age_gate_message?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  menu_weights?: "grams" | "ounces";
  logo_light?: string;
  logo_dark?: string;
  address?: string;
  phone?: string;
  order_confirmation_email?: string;
  order_confirmation_enabled?: boolean;
  website?: string;
  embed_url?: string;
  custom_domain?: string;
  timezone?: string;
  display_age_gate?: boolean;
  display_hide_address?: boolean;
}

export interface LocationConfig {
  title?: string;
  subtitle?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  hours?: { day: string; hours: string }[];
  mapEmbedUrl?: string;
}

export interface ContactConfig {
  title?: string;
  subtitle?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  telegram?: string;
  tiktok?: string;
}

export interface AboutConfig {
  title?: string;
  subtitle?: string;
  content?: string;
  mission?: string;
  vision?: string;
  year_founded?: string;
  headline?: string;
  imageUrl?: string;
  highlights?: string[];
  stats?: { num: string; label: string }[];
  show_story?: boolean;
  show_mission?: boolean;
  show_vision?: boolean;
  show_highlights?: boolean;
  show_stats?: boolean;
}

export interface SiteSettings {
  store?: StoreConfig;
  store_hours?: StoreHoursConfig;
  ordering?: OrderingConfig;
  menu_config?: MenuConfig;
  checkout_config?: CheckoutConfig;
  seo?: SeoConfig;
  theme_config?: ThemeConfig;
  header_config?: HeaderConfig;
  footer_config?: FooterConfig;
  location?: LocationConfig;
  contact?: ContactConfig;
  about?: AboutConfig;
  deal_rules?: DealRule[];
  homepage_theme?: "theme1" | "theme2" | "theme3";
  homepage_section_order?: string[];
  homepage_sections?: {
    hero?: HomepageSection & {
      badge?: string;
      headline?: string;
      subheadline?: string;
      cta_primary?: string;
      cta_primary_link?: string;
      cta_secondary?: string;
      cta_secondary_link?: string;
      bannerImageUrl?: string;
    };
    categories?: HomepageSection & {
      columns?: 2 | 3 | 4 | 5 | 6;
      mobile_columns?: 1 | 2 | 3;
      card_size?: "sm" | "md" | "lg";
      show_quick_links?: boolean;
    };
    featured?: HomepageSection;
    why_us?: HomepageSection;
    testimonials?: HomepageSection;
    newsletter?: HomepageSection & { subtitle?: string };
  };
  advanced?: {
    maintenance_mode?: boolean;
    maintenance_message?: string;
    low_stock_threshold?: number;
    debug_mode?: boolean;
  };
  taxes?: {
    enabled?: boolean;
    label?: string;
    default_rate?: number;
    tax_inclusive?: boolean;
  };
  integrations?: {
    ga4_id?: string;
    meta_pixel_id?: string;
    gtm_id?: string;
    weedmaps_url?: string;
    leafly_url?: string;
    google_business_profile_enabled?: boolean;
    google_business_profile_account_name?: string;
    google_business_profile_location_name?: string;
    google_business_profile_location_title?: string;
    google_business_profile_place_id?: string;
    google_business_profile_last_imported_at?: string;
  };

  // Keys used by individual pages (kept top-level for simple admin editing)
  maintenance_mode?: boolean;
  maintenance_message?: string;
  shop_page_subtitle?: string;
  pdp_show_specs?: boolean;
  pdp_show_effects?: boolean;
  pdp_show_terpenes?: boolean;
  pdp_show_flavors?: boolean;
  pdp_show_trust_badges?: boolean;
  pdp_show_related?: boolean;

  deals?: {
    title?: string;
    subtitle?: string;
    items?: { title: string; description: string; badge?: string }[];
  };

  faqs?: {
    title?: string;
    subtitle?: string;
    items?: {
      id: string;
      question: string;
      answer: string;
      category?: string;
      published?: boolean;
    }[];
  };

  /**
   * Shop page layout / behavior. Replaces piecemeal flags on menu_config
   * (which we still read for backward compatibility — see ShopClient).
   */
  shop_config?: {
    h1?: string;
    subtitle?: string;
    layout?: "sidebar" | "topbar" | "hybrid"; // default: hybrid
    /** Sidebar filter section toggles */
    sidebar_show_category?: boolean;
    sidebar_show_strain?: boolean;
    sidebar_show_feel?: boolean;
    sidebar_show_brand?: boolean;
    sidebar_show_price?: boolean;
    sidebar_show_in_stock_toggle?: boolean;
    /** Card visual settings (mirror MenuConfig but consolidated here) */
    desktop_columns?: 2 | 3 | 4 | 5;
    mobile_columns?: 1 | 2;
    card_shape?: "sharp" | "rounded" | "extra" | "pill";
    card_show_category?: boolean;
    card_show_strain_badge?: boolean;
    card_show_thc_badge?: boolean;
    card_show_sale_badge?: boolean;
    card_show_deal_banner?: boolean;
    card_badge_position?: "image" | "below" | "hidden";
    card_image_gradient?: boolean;
    /** Result behavior */
    page_size?: 24 | 48 | 96 | 0; // 0 = show all (no pagination)
    show_oos?: boolean;
    show_search_box?: boolean;
    /** Sort options to expose in the UI */
    sort_options?: {
      featured?: boolean;
      price_asc?: boolean;
      price_desc?: boolean;
      name_asc?: boolean;
      name_desc?: boolean;
    };
    default_sort?: "featured" | "price_asc" | "price_desc" | "name_asc" | "name_desc";
  };

  /** Product Detail Page layout / behavior */
  pdp_config?: {
    show_specs?: boolean;
    show_effects?: boolean;
    show_terpenes?: boolean;
    show_flavors?: boolean;
    show_trust_badges?: boolean;
    show_related?: boolean;
    related_count?: 3 | 4 | 6 | 8;
    /** Source for related products selection algorithm */
    related_source?: "same_category" | "same_strain" | "featured" | "newest";
    show_breadcrumb?: boolean;
    /** Side gallery vs single image */
    image_gallery_style?: "single" | "stack";
  };

  /** Location landing page copy */
  location_page?: {
    h1?: string;
    subtitle?: string;
    intro?: string;
    show_hours?: boolean;
    show_map?: boolean;
    cta_text?: string;
  };

  /** Contact landing page copy */
  contact_page?: {
    h1?: string;
    subtitle?: string;
    intro?: string;
    success_message?: string;
    show_form?: boolean;
  };
}
