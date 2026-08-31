"use client";

import { useEffect, useState } from "react";

import {
  formatUsd,
  parsePositiveAmount,
  PRESET_AMOUNTS,
  toAmountString,
} from "@/lib/amount";
import type { DemoConfig } from "@/lib/demo-config";
import { isDemoConfigReady } from "@/lib/demo-config";

type AddCreditsCardProps = {
  config: DemoConfig;
};

export function AddCreditsCard({ config }: AddCreditsCardProps) {
  const [preset, setPreset] = useState<number | null>(1);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customAmount = parsePositiveAmount(custom);
  const amount = customAmount !== null ? customAmount : preset;
  const configReady = isDemoConfigReady(config);

  useEffect(() => {
    function onPageShow() {
      setLoading(false);
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function handleSubmit() {
    if (amount === null || loading || !configReady) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: toAmountString(amount),
          apiKey: config.apiKey.trim(),
          network: config.network,
          symbol: config.symbol,
          recipient: config.recipient.trim(),
          successUrl: config.successUrl.trim(),
        }),
      });

      const payload = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.error || "Unable to start checkout");
      }

      window.location.assign(payload.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Add Credits
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Choose an amount to purchase now. You&apos;ll be redirected to
            StableFlow Pay to complete the payment.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {PRESET_AMOUNTS.map((value) => {
          const selected = preset === value && !custom.trim();
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                setPreset(value);
                setCustom("");
                setError(null);
              }}
              className={`cursor-pointer rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                selected
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300"
              }`}
            >
              ${value}
            </button>
          );
        })}
      </div>

      <label className="mt-6 block space-y-2">
        <span className="text-sm font-semibold text-zinc-900">
          Custom amount
        </span>
        <input
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          placeholder="Enter amount in USD"
          value={custom}
          onChange={(event) => {
            setCustom(event.target.value);
            setPreset(null);
            setError(null);
          }}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      <p className="mt-6 text-xs leading-5 text-zinc-500">
        All credit purchases are final and non-refundable. By proceeding, you
        agree to our{" "}
        <a href="#" className="underline underline-offset-2">
          Terms of Service
        </a>
        .
      </p>

      {!configReady ? (
        <p className="mt-4 text-sm text-amber-700" role="status">
          Fill in the demo configuration above before starting checkout.
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={amount === null || loading || !configReady}
          onClick={handleSubmit}
          className="cursor-pointer rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {loading
            ? "Redirecting..."
            : amount === null
              ? "Add credits"
              : `Add ${formatUsd(amount)} in credits`}
        </button>
      </div>
    </div>
  );
}
