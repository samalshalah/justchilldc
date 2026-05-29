/**
 * theme.ts
 *
 * Server-safe theme module. The legacy app touched document.head directly,
 * which can't run on the server. Here we split the work:
 *
 *   - palette + hex/HSL math: pure functions, run anywhere
 *   - getThemeCssVars(): returns the inline-style object for :root, called
 *     in the root layout so the user sees themed HTML on first paint
 *     (no flash of unstyled content)
 *   - <ThemeFonts/>: a tiny client component that injects Google Fonts
 *     <link> tags only for the configured fonts
 */

export interface Palette {
  id: string;
  name: string;
  mode: "dark" | "light";
  accent: string;
  primary: string;
  background: string;
  card: string;
  foreground: string;
  mutedFg: string;
  border: string;
}

export const PALETTES: Palette[] = [
  {
    id: "dark-gold",
    name: "Dark Gold",
    mode: "dark",
    accent: "#c9a84c",
    primary: "#1a4a28",
    background: "#0d1611",
    card: "#111f16",
    foreground: "#f0f5f2",
    mutedFg: "#8aaa97",
    border: "#1e3828",
  },
  {
    id: "midnight-green",
    name: "Midnight Green",
    mode: "dark",
    accent: "#10b981",
    primary: "#0f4a2a",
    background: "#0a0f0d",
    card: "#101a15",
    foreground: "#e8f5ee",
    mutedFg: "#7aaa8a",
    border: "#1a2e22",
  },
  {
    id: "deep-purple",
    name: "Deep Purple",
    mode: "dark",
    accent: "#a855f7",
    primary: "#3b1a6b",
    background: "#0d0a14",
    card: "#13101f",
    foreground: "#f0eeff",
    mutedFg: "#9988bb",
    border: "#221a35",
  },
  {
    id: "royal-blue",
    name: "Royal Blue",
    mode: "dark",
    accent: "#3b82f6",
    primary: "#1a2a6b",
    background: "#090d18",
    card: "#0f1525",
    foreground: "#e8eeff",
    mutedFg: "#8899cc",
    border: "#1a2240",
  },
  {
    id: "sunset",
    name: "Sunset Orange",
    mode: "dark",
    accent: "#f97316",
    primary: "#5a2a0f",
    background: "#0f0a07",
    card: "#1a120a",
    foreground: "#fff0e8",
    mutedFg: "#b8906a",
    border: "#2a1a0a",
  },
  {
    id: "cherry",
    name: "Cherry Red",
    mode: "dark",
    accent: "#e11d48",
    primary: "#6b1a2a",
    background: "#0f080a",
    card: "#1a0e12",
    foreground: "#ffe8ee",
    mutedFg: "#cc8899",
    border: "#2a0e18",
  },
  {
    id: "light-sage",
    name: "Light Sage",
    mode: "light",
    accent: "#2d7a4f",
    primary: "#3d9460",
    background: "#f4f8f6",
    card: "#ffffff",
    foreground: "#1a2e22",
    mutedFg: "#5a7a68",
    border: "#d0e4da",
  },
  {
    id: "light-cream",
    name: "Light Cream",
    mode: "light",
    accent: "#b8860b",
    primary: "#5a4010",
    background: "#fafaf8",
    card: "#ffffff",
    foreground: "#1a1600",
    mutedFg: "#7a6840",
    border: "#e4dcc8",
  },
];

export interface ThemeConfig {
  mode: "dark" | "light";
  preset: string;
  accent: string;
  primary: string;
  font_body: string;
  font_display: string;
  radius: number;
  product_image_gradient: boolean;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: "dark",
  preset: "dark-gold",
  accent: "#c9a84c",
  primary: "#1a4a28",
  font_body: "Epilogue",
  font_display: "Jost",
  radius: 0.75,
  product_image_gradient: true,
};

export const BODY_FONTS = [
  "Epilogue",
  "Inter",
  "Nunito",
  "Open Sans",
  "Roboto",
  "Lato",
  "DM Sans",
  "Outfit",
];

export const DISPLAY_FONTS = [
  "Jost",
  "Playfair Display",
  "Syne",
  "Space Grotesk",
  "Raleway",
  "Cormorant Garamond",
  "Oswald",
  "Bebas Neue",
];

export function hexToHsl(hex: string): string {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map((x) => x + x).join("");
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let h = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function luminance(hex: string): number {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map((x) => x + x).join("");
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastFg(hex: string): string {
  return luminance(hex) > 0.179 ? "#0a0a0a" : "#ffffff";
}

/**
 * Build the inline-style object for :root that the root layout applies
 * server-side. This is what kills the flash-of-unstyled-content the
 * legacy app had — by the time the HTML reaches the browser, the
 * CSS variables are already set.
 */
export function getThemeCssVars(
  config: Partial<ThemeConfig> | null | undefined
): Record<string, string> {
  const cfg: ThemeConfig = { ...DEFAULT_THEME_CONFIG, ...config };
  const palette = PALETTES.find((p) => p.id === cfg.preset) ?? PALETTES[0];
  const accent = cfg.accent || palette.accent;
  const primary = cfg.primary || palette.primary;

  return {
    "--background": hexToHsl(palette.background),
    "--foreground": hexToHsl(palette.foreground),
    "--card": hexToHsl(palette.card),
    "--card-foreground": hexToHsl(palette.foreground),
    "--popover": hexToHsl(palette.card),
    "--popover-foreground": hexToHsl(palette.foreground),
    "--primary": hexToHsl(primary),
    "--primary-foreground": hexToHsl(contrastFg(primary)),
    "--secondary": hexToHsl(palette.border),
    "--secondary-foreground": hexToHsl(palette.foreground),
    "--muted": hexToHsl(palette.border),
    "--muted-foreground": hexToHsl(palette.mutedFg),
    "--accent": hexToHsl(accent),
    "--accent-foreground": hexToHsl(contrastFg(accent)),
    "--destructive": "0 62.8% 30.6%",
    "--destructive-foreground": hexToHsl(palette.foreground),
    "--border": hexToHsl(palette.border),
    "--input": hexToHsl(palette.border),
    "--ring": hexToHsl(accent),
    "--radius": `${cfg.radius}rem`,
    "--font-sans": `'${cfg.font_body}', sans-serif`,
    "--font-display": `'${cfg.font_display}', sans-serif`,
  };
}

/**
 * Fixed Microsoft-style neutral palette for the admin panel.
 * Hardcoded — never changes when the customer theme changes.
 */
export const ADMIN_THEME_VARS: Record<string, string> = {
  "--background": "210 17% 95%",
  "--foreground": "220 20% 12%",
  "--card": "0 0% 100%",
  "--card-foreground": "220 20% 12%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "220 20% 12%",
  "--primary": "215 25% 22%",
  "--primary-foreground": "0 0% 100%",
  "--secondary": "210 14% 91%",
  "--secondary-foreground": "220 20% 12%",
  "--muted": "210 14% 91%",
  "--muted-foreground": "220 8% 46%",
  "--accent": "217 91% 52%",
  "--accent-foreground": "0 0% 100%",
  "--border": "220 13% 87%",
  "--input": "220 13% 87%",
  "--ring": "217 91% 52%",
};
