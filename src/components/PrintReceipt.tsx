"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
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
  // iframe 経由での印刷で canvas はコピーできないため、data URL (PNG) + <img> で描画する
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    // QR内に項目名を含めないため、固定順のJSON配列で出力する。
    const payload = [
      1,
      data.receptionNo,
      data.fiscalYear,
      data.arrivedAt,
      data.centerCode,
      data.driver.companyName,
      data.driver.name,
      data.driver.phone,
      data.plate.region,
      data.plate.classNum,
      data.plate.kana,
      data.plate.number,
      data.maxLoad,
      data.reservation?.startTime ?? "",
      data.reservation?.endTime ?? "",
    ];
    const json = JSON.stringify(payload);

    QRCode.toDataURL(json, {
      width: 240,                // 印刷時にクリアに見える解像度
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000", light: "#fff" },
    })
      .then(setQrDataUrl)
      .catch((e) => {
        console.error("QR generation failed:", e);
        setQrDataUrl("");
      });
  }, [data]);

  return (
    <div id="print-receipt" style={{ width: "74mm", fontFamily: "'MS Gothic', 'Courier New', monospace", fontSize: "12px" }}>
      {/* ヘッダー */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "4px", marginBottom: "6px" }}>
        <div style={{ fontSize: "16px", fontWeight: "bold", letterSpacing: "0.3em" }}>来 場 受 付 票</div>
      </div>

      {/* 受付番号 */}
      <div style={{ textAlign: "center", margin: "8px 0" }}>
        <div style={{ fontSize: "11px" }}>呼出番号</div>
        <div style={{ fontSize: "42px", fontWeight: "bold", lineHeight: 1.1 }}>
          {String(data.centerDailyNo).padStart(3, "0")}
        </div>
        {data.receptionNo && (
          <div style={{ fontSize: "12px", color: "#000", fontFamily: "ui-monospace, monospace", marginTop: "6px" }}>
            <div>受付番号</div>
            <strong>{data.receptionNo}</strong>
          </div>
        )}
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

      {/* QR コード（基幹システム取り込み用） */}
      <div style={{ textAlign: "center" }}>
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt="受付 QR コード"
            style={{ display: "block", margin: "0 auto", width: "30mm", height: "30mm" }}
          />
        ) : (
          <div style={{ height: "30mm", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#555" }}>
            QRコード生成中...
          </div>
        )}
        <div style={{ fontSize: "9px", color: "#555", marginTop: "2px" }}>基幹システム取り込み用</div>
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
