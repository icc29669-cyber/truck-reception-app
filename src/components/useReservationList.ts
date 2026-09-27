"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface DriverReservation {
  id: number; driverId: number | null; centerId: number; date: string;
  startTime: string; endTime: string; vehicleNumber: string; companyName: string;
  driverName: string; maxLoad: string; status: string; center?: { id: number; name: string } | null;
}

/** 履歴は開いた時だけ取得する。古い応答で新しい一覧を上書きしない。 */
export function useReservationList(scope: "upcoming" | "past", enabled = true) {
  const [items, setItems] = useState<DriverReservation[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);
  const active = useRef<AbortController | null>(null);
  const load = useCallback(async (nextPage: number) => {
    active.current?.abort();
    const controller = new AbortController(); active.current = controller;
    setLoading(true); setError(false);
    try {
      const res = await fetch(`/api/driver/reservations?mine=true&scope=${scope}&page=${nextPage}`, { signal: controller.signal });
      if (!res.ok) throw new Error();
      const data: DriverReservation[] = await res.json();
      if (controller.signal.aborted) return;
      setItems(current => nextPage === 1 ? data : [...current, ...data.filter(row => !current.some(old => old.id === row.id))]);
      setPage(nextPage); setHasMore(res.headers.get("X-Has-More") === "true");
    } catch { if (!controller.signal.aborted) setError(true); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, [scope]);
  const reload = useCallback(() => { void load(1); }, [load]);
  useEffect(() => {
    if (enabled) reload();
    return () => active.current?.abort();
  }, [enabled, reload]);
  return { items, loading, error, hasMore, reload, loadMore: () => { if (!loading) void load(page + 1); } };
}
