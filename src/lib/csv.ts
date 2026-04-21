interface ReservationRow {
  date: string;
  startTime: string;
  endTime: string;
  centerCode: string;
  centerName: string;
  companyName: string;
  driverName: string;
  vehicleNumber: string;
  maxLoad: string;
  status: string;
}

export function generateCSV(rows: ReservationRow[]): string {
  const BOM = "\uFEFF";
  const headers = ["日付", "開始時刻", "終了時刻", "センターCD", "センター", "運送会社", "ドライバー", "車番", "最大積載量(kg)", "ステータス"];

  const escapeCell = (value: string): string => {
    const s = String(value ?? "");
    // ダブルクォートをエスケープ（CSV標準: "" でエスケープ）
    const escaped = s.replace(/"/g, '""');
    // CSVインジェクション対策: 数式・コマンドとして解釈される先頭文字を無害化
    const safe = /^[=+\-@\t\r]/.test(escaped) ? "'" + escaped : escaped;
    return `"${safe}"`;
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case "confirmed": return "確定";
      case "cancelled": return "キャンセル";
      case "checked_in": return "チェックイン済";
      case "completed": return "完了";
      default: return s;
    }
  };

  const csvRows = rows.map((r) =>
    [
      r.date,
      r.startTime,
      r.endTime,
      r.centerCode,
      r.centerName,
      r.companyName,
      r.driverName,
      r.vehicleNumber,
      r.maxLoad,
      statusLabel(r.status),
    ]
      .map(escapeCell)
      .join(",")
  );

  return BOM + [headers.join(","), ...csvRows].join("\n");
}
