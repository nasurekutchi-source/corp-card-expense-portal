"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  updateConfig: (updates: Partial<ModuleConfig>) => Promise<void>;
  isLoading: boolean;
}

const ModuleConfigContext = createContext<ModuleConfigContextValue>({
  config: defaultConfig,
  updateConfig: async () => {},
  isLoading: true,
});

export function ModuleConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ModuleConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/settings/modules")
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const updateConfig = useCallback(async (updates: Partial<ModuleConfig>) => {
    const optimistic = { ...config, ...updates };
    setConfig(optimistic);
    try {
      const res = await fetch("/api/v1/settings/modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      setConfig(data);
    } catch {
      setConfig(config);
    }
  }, [config]);

  return (
    <ModuleConfigContext.Provider value={{ config, updateConfig, isLoading }}>
      {children}
    </ModuleConfigContext.Provider>
  );
}

export function useModuleConfig() {
  return useContext(ModuleConfigContext);
}
