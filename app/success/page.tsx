import Link from "next/link";

import { getDB, getOrderBySessionId, type OrderRow } from "@/lib/db";

export const dynamic = "force-dynamic";

type SuccessSearchParams = {
  amount?: string;
  created_at?: string;
  destination_txHash?: string;
  expires_at?: string;
  network?: string;
  out_order_no?: string;
  paid_at?: string;
  recipient?: string;
  session_id?: string;
  status?: string;
  symbol?: string;
  tx_hash?: string;
};

function pick(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

async function loadOrder(sessionId: string): Promise<OrderRow | null> {
  if (!sessionId) return null;
  try {
    const db = await getDB();
    return await getOrderBySessionId(db, sessionId);
  } catch (error) {
    console.error("[success] failed to load order", error);
    return null;
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<SuccessSearchParams>;
}) {
  const params = await searchParams;
  const sessionId = pick(params.session_id);
  const queryStatus = pick(params.status) || "unknown";
  const order = await loadOrder(sessionId);

  const rows: Array<{ label: string; value: string }> = [
    { label: "Status", value: queryStatus },
    { label: "Amount", value: pick(params.amount) },
    { label: "Symbol", value: pick(params.symbol) },
    { label: "Network", value: pick(params.network) },
    { label: "Session ID", value: sessionId },
    { label: "Order No", value: pick(params.out_order_no) },
    { label: "Recipient", value: pick(params.recipient) },
    { label: "Created At", value: pick(params.created_at) },
    { label: "Expires At", value: pick(params.expires_at) },
    { label: "Paid At", value: pick(params.paid_at) },
    { label: "Tx Hash", value: pick(params.tx_hash) },
    { label: "Destination Tx", value: pick(params.destination_txHash) },
  ].filter((row) => row.value);

  const isSuccess = queryStatus === "success" || order?.status === "success";

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-[520px] rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p
          className={`text-sm font-semibold uppercase tracking-wide ${
            isSuccess ? "text-emerald-600" : "text-zinc-500"
          }`}
        >
          {isSuccess ? "Payment successful" : "Payment callback"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
          {isSuccess ? "Credits added" : "Checkout returned"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          StableFlow Pay redirected back to this demo with the checkout session
          details below.
        </p>

        <dl className="mt-6 space-y-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[120px_1fr] gap-3 text-sm"
            >
              <dt className="font-medium text-zinc-500">{row.label}</dt>
              <dd className="break-all text-zinc-900">{row.value}</dd>
            </div>
          ))}
        </dl>

        {/* {order ? (
          <p className="mt-4 text-sm text-zinc-500">
            Stored order status in D1:{" "}
            <span className="font-medium text-zinc-900">{order.status}</span>
          </p>
        ) : null} */}

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Back to Add Credits
          </Link>
        </div>
      </div>
    </main>
  );
}
