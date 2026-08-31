"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { formatUsd } from "@/lib/amount";
import type { OrderRow, OrderStatus } from "@/lib/order";

function displayStatus(order: OrderRow): OrderStatus {
  if (order.status !== "pending") return order.status;
  if (!order.expires_at) return "pending";
  const expiresAt = Date.parse(order.expires_at);
  if (!Number.isFinite(expiresAt) || expiresAt > Date.now()) return "pending";
  return "expired";
}

function canRetry(order: OrderRow): boolean {
  return displayStatus(order) === "pending" && Boolean(order.session_url);
}

function formatDate(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Date(parsed).toLocaleString();
}

function formatCredits(amount: string): string {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) return amount;
  return formatUsd(parsed);
}

function statusClassName(status: OrderStatus): string {
  if (status === "success") return "text-emerald-700";
  if (status === "failed") return "text-red-600";
  if (status === "expired") return "text-zinc-500";
  return "text-amber-700";
}

export function PaymentHistoryTable() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/orders");
      const payload = (await response.json()) as {
        orders?: OrderRow[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load orders");
      }
      setOrders(payload.orders ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void refresh();
    }, 0);
    function onPageShow() {
      void refresh();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.clearTimeout(handle);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [refresh]);

  return (
    <section className="w-full max-w-[920px] rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
            Payment History
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Orders created by Add Credits. Status updates when a matching
            webhook is received.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/webhooks"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-300 hover:bg-zinc-50 opacity-10"
          >
            Webhook events
          </Link>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="whitespace-nowrap px-3 py-2 font-medium">DATE</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">
                CREDITS
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">
                PAYMENT METHOD
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">
                STATUS
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">
                actions
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-zinc-400"
                >
                  {loading ? "Loading..." : "No payments yet."}
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const status = displayStatus(order);
                const retry = canRetry(order);
                return (
                  <tr
                    key={order.id}
                    className="border-t border-zinc-100 align-middle"
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-700">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-zinc-900">
                      {formatCredits(order.amount)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-700">
                      Crypto · {order.symbol} / {order.network}
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-2 font-medium capitalize ${statusClassName(status)}`}
                    >
                      {status}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {retry ? (
                        <a
                          href={order.session_url ?? "#"}
                          className="font-semibold text-zinc-950 underline-offset-2 hover:underline"
                        >
                          Pay
                        </a>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
