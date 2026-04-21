"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

/**
 * 管理画面: ドライバー向け使い方ガイド(QR入り印刷可能シート)
 *
 * - QR は `qrcode` パッケージで自前生成(外部サービス api.qrserver.com への依存を廃止)
 * - プレビュー(画面)と 印刷レイアウト(A4 縦 1枚)を同一マークアップで両立
 * - 高齢ドライバー向けに文字を大きく、手順は3ステップに絞る
 */
export default function SettingsPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [origin, setOrigin] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => setAuthed(true))
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = window.location.origin + "/driver";
    setOrigin(url);
    // 高解像度 QR(印刷で粗くならない 600px = 約 50mm @ 300dpi 相当)
    QRCode.toDataURL(url, {
      width: 600,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#FFFFFF" },
    }).then(setQrDataUrl).catch(() => setQrDataUrl(""));
  }, []);

  if (!authed) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">読み込み中...</div>;
  }

  return (
    <div className="p-8">
      {/* ── ヘッダー(画面のみ・印刷時は非表示) ── */}
      <div className="mb-6 no-print">
        <h1 className="text-2xl font-bold text-gray-900">ドライバー向け 使い方ガイド</h1>
        <p className="text-sm text-gray-500 mt-1">QR 付きチラシを印刷して、ドライバーに配布してください</p>
      </div>

      {/* ── 操作バー(画面のみ) ── */}
      <div className="flex items-center gap-3 mb-6 no-print">
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
        >
          🖨 このページを印刷
        </button>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(origin);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors"
        >
          {copied ? "✓ コピーしました" : "URL をコピー"}
        </button>
      </div>

      {/* ══════ 印刷対象 ══════ */}
      <div ref={printRef} className="print-sheet bg-white mx-auto border border-gray-200 shadow-sm">
        {/* ── タイトル帯 ── */}
        <div className="print-header">
          <div className="title-jp">スマホでかんたん予約</div>
          <div className="title-sub">日本セイフティー株式会社 機材センター 受付予約システム</div>
        </div>

        {/* ── QR + 3 ステップ ── */}
        <div className="main-grid">
          {/* 左: QR */}
          <div className="qr-col">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="アプリURL QRコード" className="qr-img" />
            ) : (
              <div className="qr-placeholder">QR 生成中...</div>
            )}
            <div className="url-box">
              <div className="url-label">または このURLをブラウザに入力</div>
              <div className="url-value">{origin}</div>
            </div>
          </div>

          {/* 右: ステップ */}
          <div className="steps-col">
            <div className="step-title">かんたん 3 ステップ</div>
            <ol className="step-list">
              <li>
                <span className="step-num">1</span>
                <div>
                  <div className="step-main">スマホのカメラで QR を読み取る</div>
                  <div className="step-sub">画面にでたリンクをタップ</div>
                </div>
              </li>
              <li>
                <span className="step-num">2</span>
                <div>
                  <div className="step-main">電話番号を入力</div>
                  <div className="step-sub">ハイフンなし 11桁 (例: 09012345678)</div>
                </div>
              </li>
              <li>
                <span className="step-num">3</span>
                <div>
                  <div className="step-main">4桁の PIN を決める</div>
                  <div className="step-sub">次回からはこの PIN でログイン</div>
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* ── 予約の流れ ── */}
        <div className="flow-section">
          <div className="flow-title">予約の取り方</div>
          <div className="flow-grid">
            <div className="flow-item">
              <div className="flow-num">①</div>
              <div className="flow-label">センターを選ぶ</div>
            </div>
            <div className="flow-arrow">▶</div>
            <div className="flow-item">
              <div className="flow-num">②</div>
              <div className="flow-label">日付と時間を選ぶ</div>
            </div>
            <div className="flow-arrow">▶</div>
            <div className="flow-item">
              <div className="flow-num">③</div>
              <div className="flow-label">車両情報を入力</div>
            </div>
            <div className="flow-arrow">▶</div>
            <div className="flow-item">
              <div className="flow-num">④</div>
              <div className="flow-label">確認して完了</div>
            </div>
          </div>
        </div>

        {/* ── 受付の流れ(到着後) ── */}
        <div className="flow-section">
          <div className="flow-title">当日の受付(機材センター到着後)</div>
          <div className="arrival-text">
            予約の時間が近づいたら、<strong>センターのキオスク画面</strong>で電話番号を入力するだけ。<br />
            予約があれば自動で引き当てます。予約が無い日でも当日受付できます。
          </div>
        </div>

        {/* ── 困ったとき ── */}
        <div className="help-section">
          <div className="help-label">困ったとき</div>
          <div className="help-text">機材センターの管理者までお声がけください</div>
        </div>
      </div>

      {/* ══════ 印刷・スタイル ══════ */}
      <style jsx>{`
        .print-sheet {
          width: 210mm;
          min-height: 297mm;
          padding: 18mm 16mm;
          box-sizing: border-box;
          color: #1a1a1a;
          font-family: -apple-system, "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif;
        }
        .print-header {
          text-align: center;
          padding-bottom: 14px;
          border-bottom: 3px solid #1a3a6b;
          margin-bottom: 24px;
        }
        .title-jp {
          font-size: 34px;
          font-weight: 900;
          color: #1a3a6b;
          letter-spacing: 0.06em;
        }
        .title-sub {
          font-size: 14px;
          color: #555;
          margin-top: 6px;
          letter-spacing: 0.04em;
        }
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: center;
          padding: 8px 0 24px 0;
        }
        .qr-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .qr-img {
          width: 220px;
          height: 220px;
          border: 4px solid #1a3a6b;
          border-radius: 12px;
          padding: 8px;
          background: white;
        }
        .qr-placeholder {
          width: 220px;
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          border: 2px dashed #ccc;
          border-radius: 12px;
        }
        .url-box {
          width: 100%;
          text-align: center;
          background: #f2f1ed;
          border-radius: 8px;
          padding: 10px 12px;
        }
        .url-label {
          font-size: 11px;
          color: #666;
          margin-bottom: 4px;
        }
        .url-value {
          font-size: 13px;
          font-weight: 700;
          color: #1a1a1a;
          word-break: break-all;
        }
        .steps-col {
          padding-left: 10px;
        }
        .step-title {
          font-size: 22px;
          font-weight: 900;
          color: #1a3a6b;
          margin-bottom: 18px;
          border-left: 6px solid #0d9488;
          padding-left: 10px;
        }
        .step-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .step-list li {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .step-num {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #0d9488;
          color: white;
          font-size: 22px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .step-main {
          font-size: 18px;
          font-weight: 700;
          line-height: 1.3;
        }
        .step-sub {
          font-size: 13px;
          color: #666;
          margin-top: 3px;
        }
        .flow-section {
          margin-top: 20px;
          padding: 16px 18px;
          background: #f8f7f4;
          border-radius: 12px;
          border: 1px solid #e5e3dd;
        }
        .flow-title {
          font-size: 18px;
          font-weight: 900;
          color: #1a3a6b;
          margin-bottom: 12px;
        }
        .flow-grid {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: space-between;
        }
        .flow-item {
          flex: 1;
          text-align: center;
          background: white;
          border-radius: 8px;
          padding: 10px 6px;
          border: 1px solid #d4d1c8;
        }
        .flow-num {
          font-size: 22px;
          font-weight: 900;
          color: #0d9488;
        }
        .flow-label {
          font-size: 12px;
          font-weight: 700;
          color: #333;
          margin-top: 4px;
        }
        .flow-arrow {
          color: #999;
          font-size: 14px;
        }
        .arrival-text {
          font-size: 14px;
          line-height: 1.7;
          color: #333;
        }
        .arrival-text strong {
          color: #1a3a6b;
          font-weight: 800;
        }
        .help-section {
          margin-top: 20px;
          padding: 12px 18px;
          background: #fff9e6;
          border-left: 6px solid #f59e0b;
          border-radius: 6px;
        }
        .help-label {
          font-size: 13px;
          font-weight: 900;
          color: #92400e;
          margin-bottom: 2px;
        }
        .help-text {
          font-size: 14px;
          color: #444;
        }

        /* ── 印刷専用 ── */
        @media print {
          :global(body) {
            background: white;
          }
          :global(.no-print) {
            display: none !important;
          }
          .print-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            page-break-after: avoid;
          }
        }
        @page {
          size: A4;
          margin: 0;
        }
      `}</style>

      {/* タブレット幅でオーバーフローさせないための外側調整 */}
      <style jsx global>{`
        @media print {
          body, html { margin: 0 !important; padding: 0 !important; }
          .no-print, nav, header, footer { display: none !important; }
        }
      `}</style>
    </div>
  );
}
