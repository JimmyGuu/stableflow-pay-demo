"use client";

import { useSyncExternalStore } from "react";

import { AddCreditsCard } from "@/components/AddCreditsCard";
import { DemoConfigPanel } from "@/components/DemoConfigPanel";
import { PaymentHistoryTable } from "@/components/PaymentHistoryTable";
import { DEMO_WEBHOOK_BOUND_API_KEY } from "@/lib/config";
import {
  DEFAULT_DEMO_CONFIG,
  getDemoConfigSnapshot,
  resolveCheckoutConfig,
  saveDemoConfig,
  SIMPLE_MODE_DEFAULTS,
  type DemoConfig,
} from "@/lib/demo-config";

const listeners = new Set<() => void>();

function emitConfigChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getClientSnapshot(): DemoConfig {
  return getDemoConfigSnapshot();
}

function getServerSnapshot(): DemoConfig {
  return DEFAULT_DEMO_CONFIG;
}

type HomeClientProps = {
  fullMode: boolean;
};

export function HomeClient({ fullMode }: HomeClientProps) {
  const stored = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const config = resolveCheckoutConfig(stored, fullMode);

  function handleConfigChange(next: DemoConfig) {
    if (fullMode) {
      saveDemoConfig(next);
    } else {
      saveDemoConfig({
        ...SIMPLE_MODE_DEFAULTS,
        apiKey: next.apiKey,
      });
    }
    emitConfigChange();
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <div className="mb-6 flex w-full max-w-[920px] flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="flex-1 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          <p className="font-semibold">Order status needs a webhook</p>
          <p className="mt-1">
            Order status updates only after you implement a webhook and register
            it on the StableFlow Pay platform. This demo already has a default
            webhook. It is bound to API key{" "}
            <code className="break-all rounded bg-amber-100 px-1">
              {DEMO_WEBHOOK_BOUND_API_KEY}
            </code>
            . Use that key to test order status on this page. A key you enter
            yourself can still test checkout, but this page will not update
            those orders.
          </p>
        </div>
        <div className="flex-1 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-950">
          <p className="font-semibold">Security notice for demo viewers</p>
          <p className="mt-1">
            This page lets you paste{" "}
            <code className="rounded bg-red-100 px-1">STABLEFLOW_API_KEY</code>{" "}
            for local testing only. Do not expose API keys in a production
            frontend. Keep them on the server (environment variables / Workers
            secrets) in real apps.
          </p>
        </div>
      </div>

      <div className="flex w-full max-w-[920px] flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
        <DemoConfigPanel
          config={config}
          fullMode={fullMode}
          onChange={handleConfigChange}
        />
        <AddCreditsCard config={config} fullMode={fullMode} />
      </div>

      <div className="mt-6 w-full max-w-[920px]">
        <PaymentHistoryTable />
      </div>
    </main>
  );
}
