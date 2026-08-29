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

Fill server-only secrets in `.env.local` (for `next dev`) and `.dev.vars` (for Wrangler / OpenNext preview):

| Variable | Purpose |
| --- | --- |
| `STABLEFLOW_API_BASE` | StableFlow API host |
| `STABLEFLOW_PAY_HOST` | StableFlow Pay UI host (`/checkout?sessionId=`) |
| `STABLEFLOW_API_KEY` | `x-api-key` for `POST /v1/pay/checkout/sessions` |
| `STABLEFLOW_WEBHOOK_SECRET` | Webhook HMAC secret from StableFlow Settings |
| `CHECKOUT_NETWORK` | Destination network (for example `near`) |
| `CHECKOUT_SYMBOL` | Destination symbol (for example `USDC`) |
| `CHECKOUT_RECIPIENT` | Merchant recipient address |
| `NEXT_PUBLIC_APP_URL` | This demo origin, used as `success_url` |

Never expose `STABLEFLOW_API_KEY` or `STABLEFLOW_WEBHOOK_SECRET` to the browser.

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

Open [http://localhost:3000](http://localhost:3000). Choose an amount and submit to create a checkout session, then redirect to StableFlow Pay.

## Webhooks

1. Deploy or tunnel this app so StableFlow can reach it.
2. In StableFlow Pay Settings, create a webhook pointing to:
   `https://<your-demo-host>/api/webhooks`
3. Save the signing secret into `STABLEFLOW_WEBHOOK_SECRET`.

Verification follows the PingPay-compatible scheme:

- headers: `x-ping-timestamp`, `x-ping-signature`, `x-ping-event-type`
- signature: `HMAC-SHA256(secret, `${timestamp}.${rawBody}`)` hex digest
- verify against the **raw body**, then parse JSON

Successful deliveries insert into `webhook_events` (idempotent by event id) and update matching `orders.status`.

## Success redirect

After payment, StableFlow Pay redirects to:

`{NEXT_PUBLIC_APP_URL}/success?amount=&network=&expires_at=&created_at=&out_order_no=&recipient=&session_id=&status=&symbol=`

## Cloudflare deploy

```bash
pnpm cf-typegen
pnpm db:migrate:remote
pnpm deploy
```

Set the same secrets in the Cloudflare Workers dashboard (or via `wrangler secret put`).

Preview the Workers runtime locally:

```bash
pnpm preview
```
