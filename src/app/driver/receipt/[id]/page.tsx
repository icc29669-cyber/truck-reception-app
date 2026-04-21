"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { formatDateSlash } from "@/lib/dateFormat";

interface ReceiptData {
  id: number;
  centerDailyNo: number;
  barcodeValue: string;
  receptionNo: string;
  fiscalYear: string;
  arrivedAt: string;
  centerName: string;
  centerCode: string;
  vehicleNumber: string;
  plateRegion: string;
  plateClassNum: string;
  plateKana: string;
  plateNumber: string;
  companyName: string;
  driverName: string;
  phone: string;
  maxLoad: string;
  reservation: { startTime: string; endTime: string } | null;
}

function ReceiptContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ReceiptData | null>(null);
  const [error, setError] = useState("");
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const urlKey = searchParams.get("key") || "";
    // URL にキーが残ると Referer/履歴経由でリークするので即座に sessionStorage に退避して URL から消す
    if (urlKey && typeof window !== "undefined") {
      try { sessionStorage.setItem("kiosk_secret", urlKey); } catch {}
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", cleanUrl);
    }
    const storedKey = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("kiosk_secret") || "" : "";
    const authKey = urlKey || storedKey;
    const url = `/api/reception/receipt/${id}`;
    const headers: HeadersInit = authKey ? { "x-kiosk-secret": authKey } : {};
    fetch(url, { headers })
      .then((r) => {
        if (!r.ok) throw new Error("受付情報が見つかりません");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id, searchParams]);

  useEffect(() => {
    if (!data || !qrRef.current) return;

    // 基幹システムが取り込む JSON ペイロード
    const payload = {
      v: 1,                       // バージョン（将来の互換性）
      no: data.receptionNo,       // 受付番号 (基幹の センター受付番号 相当)
      fy: data.fiscalYear,        // 年度
      at: data.arrivedAt,         // 入場時間 ISO8601
      center: data.centerCode,    // 登録機材センターCD
      driver: data.driverName,    // 運転手名
      company: data.companyName,  // 運送会社名
      phone: data.phone,          // 運転手TEL
      plate: {                    // 車番
        region: data.plateRegion,
        class: data.plateClassNum,
        kana: data.plateKana,
        number: data.plateNumber,
      },
      maxLoad: data.maxLoad ? Number(data.maxLoad) : null,
      reservation: data.reservation,
    };
    const json = JSON.stringify(payload);

    QRCode.toCanvas(qrRef.current, json, {
      width: 200,          // 約 50mm @ 96dpi で印刷時に 25mm 角程度
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000", light: "#fff" },
    })
      .then(() => {
        // 自動印刷
        setTimeout(() => window.print(), 300);
      })
      .catch((e) => {
        console.error("QR generation failed:", e);
      });
  }, [data]);

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  const arrived = new Date(data.arrivedAt);
  const dateStr = formatDateSlash(arrived);
  const timeStr = `${String(arrived.getHours()).padStart(2, "0")}:${String(arrived.getMinutes()).padStart(2, "0")}`;

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 2mm; size: 80mm auto; }
          body { margin: 0; }
          .no-print { display: none !important; }
        }
        body { margin: 0; font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif; }
      `}</style>

      <div style={{
        width: "76mm",
        margin: "0 auto",
        padding: "3mm 2mm",
        fontSize: "12px",
        lineHeight: 1.4,
        color: "#000",
      }}>
        {/* ヘッダー */}
        <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "2mm", marginBottom: "2mm" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", letterSpacing: "2px" }}>受 付 票</div>
          <div style={{ fontSize: "14px", fontWeight: "bold", marginTop: "1mm" }}>{data.centerName}</div>
        </div>

        {/* 受付番号 */}
        <div style={{ textAlign: "center", margin: "3mm 0", padding: "2mm", border: "2px solid #000", borderRadius: "2mm" }}>
          <div style={{ fontSize: "11px" }}>受付番号</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", letterSpacing: "2px" }}>
            {String(data.centerDailyNo).padStart(3, "0")}
          </div>
          <div style={{ fontSize: "10px", color: "#555", marginTop: "1mm", fontFamily: "ui-monospace, monospace" }}>
            {data.receptionNo}
          </div>
        </div>

        {/* QRコード（基幹システム取り込み用） */}
        <div style={{ textAlign: "center", margin: "2mm 0 3mm" }}>
          <canvas ref={qrRef} style={{ display: "block", margin: "0 auto" }} />
          <div style={{ fontSize: "9px", color: "#555", marginTop: "1mm" }}>
            基幹システム取り込み用
          </div>
        </div>

        {/* 受付日時 */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <tbody>
            <Row label="受付日" value={dateStr} />
            <Row label="受付時刻" value={timeStr} />
            {data.reservation && (
              <Row label="予約時間" value={`${data.reservation.startTime} - ${data.reservation.endTime}`} bold />
            )}
            <Row label="運送会社" value={data.companyName} />
            <Row label="ドライバー" value={data.driverName} />
            <Row label="車両番号" value={data.vehicleNumber} bold />
            {data.maxLoad && (
              <Row label="最大積載量" value={`${Number(data.maxLoad).toLocaleString()} kg`} />
            )}
          </tbody>
        </table>

        {/* フッター */}
        <div style={{ textAlign: "center", marginTop: "4mm", paddingTop: "2mm", borderTop: "1px dashed #000", fontSize: "10px" }}>
          この受付票は荷降ろし完了まで<br />お手元に保管してください
        </div>

        {/* 印刷ボタン（画面表示時のみ） */}
        <div className="no-print" style={{ textAlign: "center", marginTop: "6mm" }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: "10px 32px",
              fontSize: "16px",
              fontWeight: "bold",
              background: "#1e3a5f",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            印刷する
          </button>
        </div>
      </div>
    </>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, textAlign: "center" }}>読み込み中...</div>}>
      <ReceiptContent />
    </Suspense>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr style={{ borderBottom: "1px dotted #ccc" }}>
      <td style={{ padding: "1.5mm 0", fontSize: "10px", color: "#555", whiteSpace: "nowrap", verticalAlign: "top" }}>
        {label}
      </td>
      <td style={{ padding: "1.5mm 0 1.5mm 2mm", fontWeight: bold ? "bold" : "normal", fontSize: bold ? "14px" : "12px", textAlign: "right" }}>
        {value}
      </td>
    </tr>
  );
}
