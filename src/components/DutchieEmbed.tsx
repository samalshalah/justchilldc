"use client";

import { useEffect, useRef, useState } from "react";

const DUTCHIE_EMBED_SCRIPT_ID = "dutchie--embed__script";
const DUTCHIE_EMBED_SRC =
  "https://dutchie.com/api/v2/embedded-menu/67bf8c7c981e3fee83df712e.js";

export function DutchieEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setFailed(false);
    container.innerHTML = "";

    const script = document.createElement("script");
    script.async = true;
    script.id = DUTCHIE_EMBED_SCRIPT_ID;
    script.src = DUTCHIE_EMBED_SRC;
    script.onerror = () => setFailed(true);

    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-2xl shadow-black/20">
      <div
        ref={containerRef}
        className="min-h-[720px] overflow-hidden rounded-md bg-background"
        aria-label="Dutchie embedded menu preview"
      />
      {failed ? (
        <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          Dutchie embed script failed to load. Check the script URL, store ID,
          or browser/network blocking.
        </p>
      ) : null}
    </div>
  );
}
