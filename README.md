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

Then set `STABLEFLOW_WEBHOOK_SECRET` in both `.env.local` and `.dev.vars` (gitignored). Never commit the real value.

Server env:

| Variable | Purpose |
| --- | --- |
| `STABLEFLOW_API_BASE` | StableFlow API host |
| `NEXT_PUBLIC_APP_URL` | This demo origin, used as `success_url` |
| `NEXT_PUBLIC_VALIDATE_CHECKOUT_RECIPIENT` | `true` to validate `CHECKOUT_RECIPIENT` against the selected network. Default `false` (also in `wrangler.jsonc` `vars`) |
| `STABLEFLOW_WEBHOOK_SECRET` | HMAC signing secret for incoming webhooks (server-only) |

Demo configuration entered in the browser UI (stored in `localStorage`):

- `STABLEFLOW_API_KEY`
- `CHECKOUT_NETWORK` (chains that have at least one receive-supported token)
- `CHECKOUT_SYMBOL` (receive-supported tokens for the selected network, from `GET /v1/pay/tokens`)
- `CHECKOUT_RECIPIENT` (required; network format check is off unless `NEXT_PUBLIC_VALIDATE_CHECKOUT_RECIPIENT=true`)
- `SUCCESS_URL` (must be an `http:` or `https:` URL; simple mode uses `NEXT_PUBLIC_APP_URL/success`)

On checkout, the API key / network / symbol / recipient / success URL are sent to the server route (demo-only). Webhook verification always uses `STABLEFLOW_WEBHOOK_SECRET` from the server environment.

The home page lists **Payment History** (D1 `orders`). Raw webhook deliveries are on `/webhooks`.

**Production apps must not put API keys in the frontend.** The page shows this warning for demo viewers.

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
- database_id: `15ae7afc-8f82-424c-8f29-a999d4014a4e`

## Develop

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Fill the demo configuration, choose an amount, then start checkout. Webhook event logs: [http://localhost:3000/webhooks](http://localhost:3000/webhooks).

## Webhooks

1. Deploy or tunnel this app so StableFlow can reach it.
2. In StableFlow Pay Settings, create a webhook pointing to:
   `https://<your-demo-host>/api/webhook`
3. Set the signing secret as `STABLEFLOW_WEBHOOK_SECRET` on the server (see Cloudflare deploy below). Do not put it in the frontend or in `wrangler.jsonc` `vars`.

Verification:

- headers: `x-stableflowpay-timestamp`, `x-stableflowpay-signature`, `x-stableflowpay-event-type`
- signature: `HMAC-SHA256(secret, `${timestamp}.${rawBody}`)` hex digest
- verify against the **raw body**, then parse JSON

Successful deliveries insert into `webhook_events` (idempotent by event id). The body is:

```json
{
  "id": "evt_...",
  "type": "payment.success",
  "created_at": "...",
  "data": {
    "payments_id": "...",
    "status": "success",
    "link_id": "...",
    "session_id": "...",
    "out_order_no": "..."
  }
}
```

Matching `orders` rows are updated by `out_order_no`, then `session_id`, then `payments_id`. Status comes from `data.status` (fallback: `type`). Pending orders that are expired, successful, or failed cannot be paid again.

## Success redirect

After payment, StableFlow Pay redirects to the configured `SUCCESS_URL` (default `{NEXT_PUBLIC_APP_URL}/success`) with query:

`amount=&network=&expires_at=&created_at=&out_order_no=&recipient=&session_id=&status=&symbol=`

## Cloudflare deploy

### Local

```bash
pnpm cf-typegen
pnpm db:migrate:remote
pnpm deploy
```

Set non-secret host vars in `wrangler.jsonc` `vars` or the Cloudflare Workers dashboard.

Set the webhook secret as an **encrypted Workers secret** (never in `wrangler.jsonc` or git):

```bash
pnpm exec wrangler secret put STABLEFLOW_WEBHOOK_SECRET
```

Or: Dashboard → Worker → Settings → Variables and Secrets → Add → Encrypt.

Preview the Workers runtime locally (reads `.dev.vars`):

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

Also set **Build variables and secrets** and runtime **Variables and Secrets**. Put `STABLEFLOW_WEBHOOK_SECRET` in encrypted secrets for runtime (required for `POST /api/webhook`). Do not store it as a plain text variable or in the repository.
