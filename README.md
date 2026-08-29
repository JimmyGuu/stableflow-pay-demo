# StableFlow Pay Demo

Merchant-side Next.js demo for StableFlow Pay API-key checkout sessions. Creates a checkout session, redirects the payer to StableFlow Pay, receives the success redirect, and verifies signed webhooks. Orders and webhook events are stored in Cloudflare D1.

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- `@opennextjs/cloudflare` for Cloudflare Workers
- Cloudflare D1 (`pay-demo`)

## Setup

```bash
pnpm install
cp .env.example .env.local
cp .dev.vars.example .dev.vars
```

Server env (hosts only):

| Variable | Purpose |
| --- | --- |
| `STABLEFLOW_API_BASE` | StableFlow API host |
| `STABLEFLOW_PAY_HOST` | StableFlow Pay UI host (`/checkout?sessionId=`) |
| `NEXT_PUBLIC_APP_URL` | This demo origin, used as `success_url` |

Demo configuration is entered in the browser UI and stored in `localStorage`:

- `STABLEFLOW_API_KEY`
- `STABLEFLOW_WEBHOOK_SECRET`
- `CHECKOUT_NETWORK` (dropdown from v3 `FIXED_CHAINS`)
- `CHECKOUT_SYMBOL` (dropdown from v3 `PAYOUT_SYMBOLS`)
- `CHECKOUT_RECIPIENT`

On checkout, the API key / network / symbol / recipient are sent to the server route (demo-only). The webhook secret is upserted into D1 so `/api/webhooks` can verify signatures.

**Production apps must not put API keys or webhook secrets in the frontend.** The page shows this warning for demo viewers.

## Database

Apply migrations locally:

```bash
pnpm db:migrate:local
```

Apply to the remote D1 database:

```bash
pnpm db:migrate:remote
```

D1 binding in `wrangler.jsonc`:

- binding: `DB`
- database_name: `pay-demo`
- database_id: `2aa4f240-7beb-4597-983c-9b47106de5e0`

## Develop

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Fill the demo configuration, choose an amount, then start checkout.

## Webhooks

1. Deploy or tunnel this app so StableFlow can reach it.
2. In StableFlow Pay Settings, create a webhook pointing to:
   `https://<your-demo-host>/api/webhooks`
3. Paste the signing secret into the demo UI (`STABLEFLOW_WEBHOOK_SECRET`) and run a checkout once so it is saved to D1.

Verification follows the PingPay-compatible scheme:

- headers: `x-ping-timestamp`, `x-ping-signature`, `x-ping-event-type`
- signature: `HMAC-SHA256(secret, `${timestamp}.${rawBody}`)` hex digest
- verify against the **raw body**, then parse JSON

Successful deliveries insert into `webhook_events` (idempotent by event id) and update matching `orders.status`.

## Success redirect

After payment, StableFlow Pay redirects to:

`{NEXT_PUBLIC_APP_URL}/success?amount=&network=&expires_at=&created_at=&out_order_no=&recipient=&session_id=&status=&symbol=`

## Cloudflare deploy

### Local

```bash
pnpm cf-typegen
pnpm db:migrate:remote
pnpm deploy
```

Set host env vars in the Cloudflare Workers dashboard (or via `wrangler secret put` / vars).

Preview the Workers runtime locally:

```bash
pnpm preview
```

### Workers Builds (GitHub)

In the Worker → **Settings** → **Builds**, use OpenNext commands (not `pnpm build` / `next build`):

| Setting | Value |
| --- | --- |
| Build command | `pnpm install && pnpm run build:cf` |
| Deploy command | `pnpm exec opennextjs-cloudflare deploy` |
| Non-production deploy | `pnpm exec opennextjs-cloudflare upload` |

`pnpm build` only produces `.next/`. Workers need `.open-next/` from `build:cf` (`opennextjs-cloudflare build`). Skipping that causes: `Could not find compiled Open Next config`.

Also set **Build variables and secrets** and runtime **Variables and Secrets** for the host env vars listed above.
