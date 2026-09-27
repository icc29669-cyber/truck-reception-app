"use client";

import { createContext, useContext } from "react";
import type { KioskInputOrder } from "@/lib/kioskInputOrder";

export const KioskInputOrderContext = createContext<KioskInputOrder>("left-first");

export function useKioskInputOrder(): KioskInputOrder {
  return useContext(KioskInputOrderContext);
}
