/**
 * SettingsProvider — wraps the storefront with server-loaded settings
 * passed down via React Context. Client components read it via
 * useSettings() without ever making an HTTP call.
 */
"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteSettings } from "@/lib/types";

const SettingsContext = createContext<SiteSettings | null>(null);

export function SettingsProvider({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: ReactNode;
}) {
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SiteSettings {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    // Render with empty settings rather than crashing — defaults will apply.
    return {};
  }
  return ctx;
}
