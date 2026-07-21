const DUTCHIE_EMBED_SRC =
  "https://dutchie.com/api/v2/embedded-menu/67bf8c7c981e3fee83df712e.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>Dutchie Embed Preview</title>
    <style>
      :root {
        color-scheme: dark;
        --background: #070707;
        --panel: #111111;
        --border: #2c2c2c;
        --text: #f8f1e6;
        --muted: #b9aa99;
        --accent: #c99f4a;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background: var(--background);
        color: var(--text);
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif;
      }

      main {
        width: min(100% - 32px, 1280px);
        margin: 0 auto;
        padding: 32px 0;
      }

      header {
        margin-bottom: 24px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--panel);
        padding: 20px;
      }

      p {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.55;
      }

      .eyebrow {
        color: var(--accent);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      h1 {
        margin: 8px 0;
        font-size: clamp(28px, 4vw, 42px);
        line-height: 1.1;
      }

      .embed-shell {
        min-height: 720px;
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: #000;
        padding: 12px;
      }

      @media (max-width: 640px) {
        main {
          width: min(100% - 20px, 1280px);
          padding: 20px 0;
        }

        header {
          padding: 16px;
        }

        .embed-shell {
          padding: 8px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p class="eyebrow">Internal preview</p>
        <h1>Dutchie Embed Preview</h1>
        <p>
          This page is intentionally unlinked from the storefront navigation and
          marked noindex. Use it to confirm the Dutchie embedded menu before
          deciding whether to replace or integrate inventory syncing.
        </p>
      </header>

      <section class="embed-shell" aria-label="Dutchie embedded menu preview">
        <div>
          <script async id="dutchie--embed__script" src="${DUTCHIE_EMBED_SRC}"></script>
        </div>
      </section>
    </main>
  </body>
</html>`,
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
