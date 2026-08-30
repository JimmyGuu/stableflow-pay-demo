"use client";

import { useCallback, useEffect, useState } from "react";

export type WebhookEventItem = {
  id: string;
  type: string;
  resource_id: string | null;
  payload_json: string;
  received_at: string;
};

function formatPayloadPreview(payloadJson: string): string {
  try {
    return JSON.stringify(JSON.parse(payloadJson));
  } catch {
    return payloadJson;
  }
}

export function WebhookEventsTable() {
  const [events, setEvents] = useState<WebhookEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/webhook");
      const payload = (await response.json()) as {
        events?: WebhookEventItem[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load webhook events");
      }
      setEvents(payload.events ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(handle);
  }, [refresh]);

  return (
    <section className="w-full max-w-[920px] rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
            Received webhook events
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Messages received by{" "}
            <code className="rounded bg-zinc-100 px-1">POST /api/webhook</code>{" "}
            and stored in D1.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
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
              <th className="whitespace-nowrap px-3 py-2 font-medium">
                Received
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">Type</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">
                Event ID
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">
                Resource
              </th>
              <th className="px-3 py-2 font-medium">Payload</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-zinc-400"
                >
                  {loading ? "Loading..." : "No webhook events yet."}
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  key={event.id}
                  className="border-t border-zinc-100 align-top"
                >
                  <td className="whitespace-nowrap px-3 py-2 text-zinc-700">
                    {event.received_at}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-zinc-900">
                    {event.type}
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-2 font-mono text-xs text-zinc-600">
                    {event.id}
                  </td>
                  <td className="max-w-[140px] truncate px-3 py-2 font-mono text-xs text-zinc-600">
                    {event.resource_id || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <pre className="max-h-24 max-w-[320px] overflow-auto rounded-lg bg-zinc-50 p-2 font-mono text-xs text-zinc-700">
                      {formatPayloadPreview(event.payload_json)}
                    </pre>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
