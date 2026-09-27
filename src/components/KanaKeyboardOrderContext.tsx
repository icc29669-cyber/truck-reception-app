"use client";

import { createContext, useContext } from "react";
import type { KanaKeyboardOrder } from "@/lib/kanaKeyboardOrder";

export const KanaKeyboardOrderContext = createContext<KanaKeyboardOrder>("left-first");

export function useKanaKeyboardOrder(): KanaKeyboardOrder {
  return useContext(KanaKeyboardOrderContext);
}
