"use client";

import { useSyncExternalStore } from "react";

import { AddCreditsCard } from "@/components/AddCreditsCard";
import { DemoConfigPanel } from "@/components/DemoConfigPanel";
import {
  DEFAULT_DEMO_CONFIG,
  getDemoConfigSnapshot,
  saveDemoConfig,
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

export function HomeClient() {
  const config = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  function handleConfigChange(next: DemoConfig) {
    saveDemoConfig(next);
    emitConfigChange();
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <div className="mb-6 w-full max-w-[440px] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
        <p className="font-semibold">Security notice for demo viewers</p>
        <p className="mt-1">
          This page lets you paste{" "}
          <code className="rounded bg-amber-100 px-1">STABLEFLOW_API_KEY</code>{" "}
          and{" "}
          <code className="rounded bg-amber-100 px-1">
            STABLEFLOW_WEBHOOK_SECRET
          </code>{" "}
          for local testing only. Do not expose these secrets in a production
          frontend. Keep them on the server (environment variables / Workers
          secrets) in real apps.
        </p>
      </div>

      <div className="flex w-full max-w-[920px] flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
        <DemoConfigPanel config={config} onChange={handleConfigChange} />
        <AddCreditsCard config={config} />
      </div>
    </main>
  );
}
