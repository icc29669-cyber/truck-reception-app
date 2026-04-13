"use client";
import { useEffect, useRef } from "react";
import type { ReceptionResult } from "@/types/reception";

interface Props {
  data: ReceptionResult;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

export default function PrintReceipt({ data }: Props) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!barcodeRef.current) return;
    import("jsbarcode").then((mod) => {
      const barcodeVal = data.barcodeValue ?? String(data.id);
      mod.default(barcodeRef.current!, barcodeVal, {
        format: "CODE128",
        width: 1.8,
        height: 55,
        displayValue: true,
        fontSize: 10,
        margin: 2,
      });
    }).catch(() => {
      // jsbarcode が読み込めない場合はスキップ
    });
  }, [data.id, data.barcodeValue]);

  return (
    <div id="print-receipt" style={{ width: "74mm", fontFamily: "'MS Gothic', 'Courier New', monospace", fontSize: "12px" }}>
      {/* ヘッダー */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "4px", marginBottom: "6px" }}>
        <div style={{ fontSize: "16px", fontWeight: "bold", letterSpacing: "0.3em" }}>来 場 受 付 票</div>
      </div>

      {/* 受付番号 */}
      <div style={{ textAlign: "center", margin: "8px 0" }}>
        <div style={{ fontSize: "11px" }}>受付番号</div>
        <div style={{ fontSize: "42px", fontWeight: "bold", lineHeight: 1.1 }}>
          {String(data.centerDailyNo).padStart(3, "0")}
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* 受付日時 */}
      <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ width: "35%", paddingRight: "4px", verticalAlign: "top" }}>受付日時</td>
            <td style={{ fontWeight: "bold" }}>{formatDateTime(data.arrivedAt)}</td>
          </tr>
          {data.centerName && (
            <tr>
              <td style={{ paddingRight: "4px", verticalAlign: "top" }}>センター</td>
              <td style={{ fontWeight: "bold" }}>{data.centerName}</td>
            </tr>
          )}
          {data.reservation && (
            <tr>
              <td style={{ paddingRight: "4px", verticalAlign: "top" }}>予約時間</td>
              <td style={{ fontWeight: "bold", fontSize: "14px" }}>
                {data.reservation.startTime} 〜 {data.reservation.endTime}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* バーコード */}
      <div style={{ textAlign: "center" }}>
        <svg ref={barcodeRef} style={{ width: "100%" }} />
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* ドライバー情報 */}
      <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ width: "30%", paddingRight: "4px", verticalAlign: "top" }}>会社名</td>
            <td style={{ fontWeight: "bold", fontSize: "11px", wordBreak: "break-all" }}>{data.driver.companyName}</td>
          </tr>
          <tr>
            <td style={{ paddingRight: "4px", verticalAlign: "top" }}>お名前</td>
            <td style={{ fontWeight: "bold" }}>{data.driver.name}</td>
          </tr>
          <tr>
            <td style={{ paddingRight: "4px", verticalAlign: "top" }}>車両番号</td>
            <td style={{ fontWeight: "bold" }}>{data.vehicleNumber}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ borderTop: "2px solid #000", marginTop: "10px", paddingTop: "6px", textAlign: "center" }}>
        <div style={{ fontSize: "11px", fontWeight: "bold" }}>受付カウンターへお持ちください</div>
      </div>
    </div>
  );
}
