import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";

import {
  DEFAULT_DEMO_CONFIG,
  DEMO_CONFIG_STORAGE_KEY,
  parseDemoConfig,
  type DemoConfig,
} from "@/lib/demo-config";

type DemoConfigState = DemoConfig & {
  setConfig: (partial: Partial<DemoConfig>) => void;
};

const persistStorage: PersistStorage<DemoConfig> = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(name);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && "state" in parsed) {
        const envelope = parsed as { state: unknown; version?: number };
        return {
          state: parseDemoConfig(envelope.state),
          version: envelope.version ?? 0,
        };
      }
      return { state: parseDemoConfig(parsed), version: 0 };
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(name);
  },
};

export const useDemoConfigStore = create<DemoConfigState>()(
  persist(
    (set) => ({
      ...DEFAULT_DEMO_CONFIG,
      setConfig: (partial) => set(partial),
    }),
    {
      name: DEMO_CONFIG_STORAGE_KEY,
      storage: persistStorage,
      skipHydration: true,
      partialize: (state) => ({
        apiKey: state.apiKey,
        network: state.network,
        symbol: state.symbol,
        recipient: state.recipient,
        successUrl: state.successUrl,
      }),
    },
  ),
);
