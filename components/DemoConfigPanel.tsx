"use client";

import { useEffect, useMemo, useState } from "react";

import { validateAddress } from "@/lib/address";
import {
  chainsForReceive,
  resolveCheckoutPair,
  symbolsForNetwork,
  type PayToken,
} from "@/lib/checkout-options";
import { shouldValidateCheckoutRecipient } from "@/lib/config";
import type { DemoConfig } from "@/lib/demo-config";
import { defaultSuccessUrl, isValidHttpUrl } from "@/lib/url";

type DemoConfigPanelProps = {
  config: DemoConfig;
  fullMode: boolean;
  onChange: (next: DemoConfig) => void;
};

const fieldClassName =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400";

export function DemoConfigPanel({
  config,
  fullMode,
  onChange,
}: DemoConfigPanelProps) {
  const [tokens, setTokens] = useState<PayToken[]>([]);
  const [tokensLoading, setTokensLoading] = useState(fullMode);
  const [tokensError, setTokensError] = useState<string | null>(null);

  useEffect(() => {
    if (!fullMode) return;

    let cancelled = false;

    async function loadTokens() {
      setTokensLoading(true);
      setTokensError(null);
      try {
        const response = await fetch("/api/tokens");
        const payload = (await response.json()) as {
          tokens?: PayToken[];
          error?: string;
        };
        if (!response.ok || !Array.isArray(payload.tokens)) {
          throw new Error(payload.error || "Unable to load tokens");
        }
        if (!cancelled) setTokens(payload.tokens);
      } catch (error) {
        if (!cancelled) {
          setTokens([]);
          setTokensError(
            error instanceof Error ? error.message : "Unable to load tokens",
          );
        }
      } finally {
        if (!cancelled) setTokensLoading(false);
      }
    }

    void loadTokens();
    return () => {
      cancelled = true;
    };
  }, [fullMode]);

  useEffect(() => {
    if (!fullMode) return;
    if (config.successUrl) return;
    onChange({ ...config, successUrl: defaultSuccessUrl() });
  }, [fullMode, config, onChange]);

  useEffect(() => {
    if (!fullMode || tokensLoading || tokensError || tokens.length === 0) {
      return;
    }
    const next = resolveCheckoutPair(tokens, config.network, config.symbol);
    if (next.network === config.network && next.symbol === config.symbol) {
      return;
    }
    onChange({ ...config, ...next });
  }, [
    fullMode,
    tokens,
    tokensLoading,
    tokensError,
    config,
    onChange,
  ]);

  const chains = useMemo(() => chainsForReceive(tokens), [tokens]);
  const symbols = useMemo(
    () => symbolsForNetwork(tokens, config.network),
    [tokens, config.network],
  );
  const selectsDisabled = tokensLoading || Boolean(tokensError);
  const recipientError =
    shouldValidateCheckoutRecipient() && config.recipient.trim()
      ? validateAddress(config.recipient, config.network).error
      : undefined;
  const successUrlError = config.successUrl.trim()
    ? isValidHttpUrl(config.successUrl)
      ? undefined
      : "Enter a valid http(s) URL"
    : undefined;

  function update<K extends keyof DemoConfig>(key: K, value: DemoConfig[K]) {
    onChange({ ...config, [key]: value });
  }

  function handleNetworkChange(network: string) {
    const next = resolveCheckoutPair(tokens, network, config.symbol);
    onChange({ ...config, ...next });
  }

  return (
    <section className="w-full max-w-[440px] rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
        Demo configuration
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-500">
        {fullMode
          ? "Values below are used when creating checkout sessions. Webhook signature verification uses STABLEFLOW_WEBHOOK_SECRET from the server environment."
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
                CHECKOUT_NETWORK
              </span>
              <select
                value={config.network}
                disabled={selectsDisabled}
                onChange={(event) => handleNetworkChange(event.target.value)}
                className={fieldClassName}
              >
                {chains.map((chain) => (
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
                disabled={selectsDisabled}
                onChange={(event) => update("symbol", event.target.value)}
                className={fieldClassName}
              >
                {symbols.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </label>

            {tokensLoading ? (
              <p className="text-sm text-zinc-500" role="status">
                Loading supported assets…
              </p>
            ) : null}

            {tokensError ? (
              <p className="text-sm text-red-600" role="alert">
                {tokensError}
              </p>
            ) : null}

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
              {recipientError ? (
                <p className="text-sm text-red-600" role="alert">
                  {recipientError}
                </p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-900">
                SUCCESS_URL
              </span>
              <input
                type="url"
                autoComplete="off"
                placeholder="https://example.com/success"
                value={config.successUrl}
                onChange={(event) => update("successUrl", event.target.value)}
                className={fieldClassName}
              />
              {successUrlError ? (
                <p className="text-sm text-red-600" role="alert">
                  {successUrlError}
                </p>
              ) : null}
            </label>
          </>
        ) : null}
      </div>
    </section>
  );
}
