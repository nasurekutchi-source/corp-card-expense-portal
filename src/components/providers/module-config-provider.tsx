"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

export interface ModuleConfig {
  cardPortal: boolean;
  expenseManagement: boolean;
  ocrReceipts: boolean;
  aiAssistant: boolean;
  mileageTracking: boolean;
  perDiem: boolean;
  teamsIntegration: boolean;
  apExport: boolean;
}

const defaultConfig: ModuleConfig = {
  cardPortal: true,
  expenseManagement: false,
  ocrReceipts: true,
  aiAssistant: true,
  mileageTracking: false,
  perDiem: false,
  teamsIntegration: true,
  apExport: true,
};

interface ModuleConfigContextValue {
  config: ModuleConfig;
  updateConfig: (updates: Partial<ModuleConfig>) => void;
  isLoading: boolean;
}

const ModuleConfigContext = createContext<ModuleConfigContextValue>({
  config: defaultConfig,
  updateConfig: () => {},
  isLoading: true,
});

export function ModuleConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ModuleConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/settings/modules")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => setConfig(data))
      .catch(() => {
        // API not available, use defaults
      })
      .finally(() => setIsLoading(false));
  }, []);

  function updateConfig(updates: Partial<ModuleConfig>) {
    // Optimistic update — immediately reflect in UI
    setConfig((prev) => {
      const next = { ...prev, ...updates };

      // Fire-and-forget API call to persist
      fetch("/api/v1/settings/modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});

      return next;
    });
  }

  return (
    <ModuleConfigContext.Provider value={{ config, updateConfig, isLoading }}>
      {children}
    </ModuleConfigContext.Provider>
  );
}

export function useModuleConfig() {
  return useContext(ModuleConfigContext);
}
