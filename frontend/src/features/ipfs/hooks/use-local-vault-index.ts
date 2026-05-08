"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getLocalItems } from "../lib/local-index";
import type { VaultItem } from "../types";

let listeners: Array<() => void> = [];
let cachedSnapshot: VaultItem[] | null = null;

function subscribe(callback: () => void) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function getSnapshot(): VaultItem[] {
  if (cachedSnapshot === null) {
    cachedSnapshot = getLocalItems();
  }
  return cachedSnapshot;
}

function emptyItems(): VaultItem[] {
  return [];
}

function notify() {
  cachedSnapshot = null;
  listeners.forEach((l) => l());
}

export function useLocalVaultIndex() {
  const items = useSyncExternalStore(subscribe, getSnapshot, emptyItems);

  const refresh = useCallback(() => notify(), []);

  useEffect(() => {
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  return { items, refresh };
}

export { notify as notifyVaultIndexChanged };
