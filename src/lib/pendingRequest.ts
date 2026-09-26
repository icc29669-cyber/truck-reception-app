export function readPendingRequest(storageKey: string): { requestId: string; payload: unknown } | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    if (typeof saved?.fingerprint !== "string" || typeof saved?.requestId !== "string" ||
        !/^[A-Za-z0-9_-]{16,64}$/.test(saved.requestId)) return null;
    return { requestId: saved.requestId, payload: JSON.parse(saved.fingerprint) };
  } catch { return null; }
}

/** 成否不明の送信は、再試行・画面再読込後も同じIDで照会する。 */
export function getPendingRequestId(storageKey: string, payload: unknown): string {
  const fingerprint = JSON.stringify(payload);
  let pending: { fingerprint?: string; requestId?: string } | null = null;
  try {
    pending = JSON.parse(sessionStorage.getItem(storageKey) || "null");
  } catch {
    // 壊れた保存データは新しいIDで置き換える。書き込み不能の場合は下で送信を止める。
  }
  if (pending?.fingerprint === fingerprint &&
      typeof pending.requestId === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(pending.requestId)) {
    return pending.requestId;
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const requestId = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  // 保存できない端末では送信しない。保存前に送信すると再読込で重複を防げなくなる。
  sessionStorage.setItem(storageKey, JSON.stringify({ fingerprint, requestId }));
  return requestId;
}

export function clearPendingRequest(storageKey: string): void {
  sessionStorage.removeItem(storageKey);
}
