"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadPrinterSettings, type PrinterSettings } from "@/lib/printerSettings";
import { printReceipt } from "@/lib/receiptPrinter";

/** 設定取得・QR描画・印刷の準備状態をまとめる。再試行では両方を読み直す。 */
export function useReceiptPrinter() {
  const [attempt, setAttempt] = useState(0);
  const [settings, setSettings] = useState<PrinterSettings | null>(null);
  const [qrReady, setQrReady] = useState(false);
  const [configError, setConfigError] = useState(false);
  const [printError, setPrintError] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printed, setPrinted] = useState(false);
  const handledAttempt = useRef(-1);
  const onQrReady = useCallback(() => setQrReady(true), []);
  const onQrError = useCallback(() => { setQrError(true); setQrReady(false); }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let active = true;
    loadPrinterSettings(controller.signal).then(value => { if (active) setSettings(value); })
      .catch(() => { if (active) setConfigError(true); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [attempt]);

  useEffect(() => {
    if (!settings || !qrReady || qrError || configError || (!settings.autoPrint && attempt === 0) || handledAttempt.current === attempt) return;
    handledAttempt.current = attempt;
    const controller = new AbortController();
    let active = true;
    setPrinting(true);
    printReceipt(settings.paperWidth, controller.signal)
      .then(() => { if (active) setPrinted(true); })
      .catch(() => { if (active) setPrintError(true); })
      .finally(() => { if (active) setPrinting(false); });
    return () => { active = false; controller.abort(); };
  }, [attempt, settings, qrReady, qrError, configError]);

  function retryPrint() {
    if (printing) return;
    setSettings(null); setQrReady(false); setConfigError(false); setQrError(false); setPrintError(false); setPrinted(false);
    setAttempt(value => value + 1);
  }
  const error = configError || qrError || printError;
  return { attempt, onQrReady, onQrError, retryPrint, printing, error,
    readyToLeave: !!settings && qrReady && !printing && !error && (!settings.autoPrint || printed) };
}
