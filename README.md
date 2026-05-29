# White Label Storefront

A white-label Next.js storefront and admin system for a regulated local retail menu. The app includes configurable branding, SEO, theme controls, product/category/brand management, inventory, orders, media uploads, and CSV import.

## Local Preview

1. Install dependencies with pnpm.
2. Copy `.env.example` to `.env.local`.
3. Set `ADMIN_PASSWORD`.
4. Use `LOCAL_PREVIEW_MODE=1` when you want to preview pages without a production database.
5. Run the development server and open `http://localhost:3000`.

## Production Setup

Before launch, configure:

- `NEXT_PUBLIC_SITE_URL` with the launch domain. The production domain is `https://justchilldc.com`.
- `ADMIN_PASSWORD` as a Cloudflare Worker secret.
- A production Postgres database connected through Cloudflare Hyperdrive.
- R2 buckets for uploaded media and OpenNext cache.
- Store settings in the admin area: name, tagline, logos, domain, SEO, location, contact details, age gate copy, checkout terms, theme, and page copy.

## Cloudflare Deployment

This project is prepared for Cloudflare Workers through OpenNext.

- `wrangler.jsonc` is configured for the production `justchilldc.com` domain and the temporary `chill.prodgt.com` preview route.
- `open-next.config.ts` configures the OpenNext Cloudflare adapter.
- `public/_headers` defines baseline security headers.
- `.github/workflows/deploy-cloudflare.yml` deploys `main` to Cloudflare after the `CLOUDFLARE_API_TOKEN` GitHub repository secret is added.

Update all placeholder names in `wrangler.jsonc` before deploying.

## White-Label Notes

The neutral fallback copy lives in `src/lib/defaults.ts`. Production storefronts should override those defaults from admin settings and deployment environment variables. Avoid hardcoding brand names, cities, domains, or market-specific legal language outside that file or the admin-managed settings.
