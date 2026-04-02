"use client";
import { useEffect, useRef } from "react";
import type { ReceptionResult } from "@/types/reception";

interface Props {
  data: ReceptionResult;
}

function formatDateTime(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

export default function PrintReceipt({ data }: Props) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!barcodeRef.current) return;
    import("jsbarcode").then((mod) => {
      mod.default(barcodeRef.current!, data.barcodeValue, {
        format: "CODE128",
        width: 1.8,
        height: 55,
        displayValue: true,
        fontSize: 10,
        margin: 2,
      });
    });
  }, [data.barcodeValue]);

  return (
    <div id="print-receipt" style={{ width: "74mm", fontFamily: "'MS Gothic', monospace", fontSize: "12px" }}>
      {/* ヘッダー */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "4px", marginBottom: "6px" }}>
        <div style={{ fontSize: "14px", fontWeight: "bold" }}>来 場 受 付 票</div>
      </div>

      {/* 受付番号 */}
      <div style={{ textAlign: "center", margin: "6px 0" }}>
        <div style={{ fontSize: "11px" }}>受付番号</div>
        <div style={{ fontSize: "36px", fontWeight: "bold", lineHeight: 1 }}>
          {String(data.centerDailyNo).padStart(3, "0")}
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* 受付日時 */}
      <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ width: "40%", paddingRight: "4px" }}>受付日時</td>
            <td style={{ fontWeight: "bold" }}>{formatDateTime(data.arrivedAt)}</td>
          </tr>
          {data.reservation && (
            <tr>
              <td style={{ color: "#000", paddingRight: "4px" }}>予約時間</td>
              <td style={{ fontWeight: "bold", fontSize: "14px" }}>
                {data.reservation.startTime}〜{data.reservation.endTime}
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
            <td style={{ width: "30%", paddingRight: "4px" }}>会社名</td>
            <td style={{ fontWeight: "bold", fontSize: "11px" }}>{data.driver.companyName}</td>
          </tr>
          <tr>
            <td style={{ paddingRight: "4px" }}>お名前</td>
            <td style={{ fontWeight: "bold" }}>{data.driver.name}</td>
          </tr>
          <tr>
            <td style={{ paddingRight: "4px" }}>車両番号</td>
            <td style={{ fontWeight: "bold" }}>{data.vehicleNumber}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ borderTop: "2px solid #000", marginTop: "8px", paddingTop: "4px", textAlign: "center", fontSize: "10px" }}>
        受付カウンターへお持ちください
      </div>
    </div>
  );
}
