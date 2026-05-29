# Cloudflare Migration

This copy is prepared for Cloudflare Workers using the OpenNext Cloudflare adapter. Cloudflare currently recommends Workers/OpenNext for full-stack Next.js apps; Pages is only the right fit for static exports.

## What changed

- Added `@opennextjs/cloudflare`, `wrangler`, OpenNext scripts, `wrangler.jsonc`, and `open-next.config.ts`.
- Added static asset cache headers in `public/_headers`.
- Removed the Replit-specific object storage sidecar path and migrated media uploads to an R2 binding named `MEDIA_BUCKET`.
- Kept existing stored media URL shapes, so `/api/storage/objects/...` and `/api/storage/public/...` still work.
- Added Hyperdrive support: local development can use `DATABASE_URL`; deployed Workers can use the `HYPERDRIVE` binding.

## Cloudflare resources to create

1. Worker: `chill-prodgit-storefront`
2. Production custom domain: `justchilldc.com`
3. Temporary preview domain: `chill.prodgt.com`
3. R2 bucket for media: `chill-prodgit-media`
4. R2 bucket for Next incremental cache: `chill-prodgit-next-cache`
5. Hyperdrive config connected to your production Postgres database
6. Worker secrets:
   - `ADMIN_PASSWORD`
   - Optional direct `DATABASE_URL` only if you are not using Hyperdrive

After you create Hyperdrive, replace `replace-with-cloudflare-hyperdrive-id` in `wrangler.jsonc` with the real ID.
The canonical production URL is configured as `https://justchilldc.com`.

## Commands

```bash
npm install
npm run db:push
npm run preview
npm run deploy
```

Use `npm run preview` before production deploy because it runs the app in the Workers runtime, which catches issues that plain `next dev` can miss.

## Still not launch-complete

- Contact form still logs submissions until an email/Slack/Twilio integration is wired.
- Newsletter still logs signups until Mailchimp or another provider is wired.
- Order confirmation emails are still TODO.
- The single `ADMIN_PASSWORD` model is okay for one owner/admin, but not ideal for multi-staff.
- Cannabis compliance language and ordering flow should be reviewed by counsel before public launch.
