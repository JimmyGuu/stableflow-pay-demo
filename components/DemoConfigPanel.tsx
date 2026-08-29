"use client";

import {
  FIXED_CHAINS,
  PAYOUT_SYMBOLS,
} from "@/lib/checkout-options";
import type { DemoConfig } from "@/lib/demo-config";

type DemoConfigPanelProps = {
  config: DemoConfig;
  fullMode: boolean;
  onChange: (next: DemoConfig) => void;
};

const fieldClassName =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400";

export function DemoConfigPanel({
  config,
  fullMode,
  onChange,
}: DemoConfigPanelProps) {
  function update<K extends keyof DemoConfig>(key: K, value: DemoConfig[K]) {
    onChange({ ...config, [key]: value });
  }

  return (
    <section className="w-full max-w-[440px] rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
        Demo configuration
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-500">
        {fullMode
          ? "Values below are used when creating checkout sessions. The webhook secret is saved to D1 on checkout so incoming webhooks can be verified."
          : "Enter your StableFlow API key to start a checkout. Other settings use built-in demo defaults."}
      </p>

      <div className="mt-6 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-zinc-900">
            STABLEFLOW_API_KEY
          </span>
          <input
            type="password"
            autoComplete="off"
            placeholder="x-api-key value"
            value={config.apiKey}
            onChange={(event) => update("apiKey", event.target.value)}
            className={fieldClassName}
          />
        </label>

        {fullMode ? (
          <>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-900">
                STABLEFLOW_WEBHOOK_SECRET
              </span>
              <input
                type="password"
                autoComplete="off"
                placeholder="whsec_..."
                value={config.webhookSecret}
                onChange={(event) =>
                  update("webhookSecret", event.target.value)
                }
                className={fieldClassName}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-900">
                CHECKOUT_NETWORK
              </span>
              <select
                value={config.network}
                onChange={(event) => update("network", event.target.value)}
                className={fieldClassName}
              >
                {FIXED_CHAINS.map((chain) => (
                  <option key={chain.blockchain} value={chain.blockchain}>
                    {chain.chainName} ({chain.blockchain})
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-900">
                CHECKOUT_SYMBOL
              </span>
              <select
                value={config.symbol}
                onChange={(event) => update("symbol", event.target.value)}
                className={fieldClassName}
              >
                {PAYOUT_SYMBOLS.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-900">
                CHECKOUT_RECIPIENT
              </span>
              <input
                type="text"
                autoComplete="off"
                placeholder="Recipient address"
                value={config.recipient}
                onChange={(event) => update("recipient", event.target.value)}
                className={fieldClassName}
              />
            </label>
          </>
        ) : null}
      </div>
    </section>
  );
}
