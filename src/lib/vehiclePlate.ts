/** 保存済み車番（空白あり・なし）を受付のプレート4項目に戻す。 */
export function parseVehicleNumber(value: string) {
  const compact = value.normalize("NFKC").replace(/[\s・･.\-]/g, "");
  const match = compact.match(/^([^\d]+?)([0-9A-Za-z]{1,4})([ぁ-んA-Za-z])(\d{0,4})$/);
  return match
    ? { region: match[1], classNum: match[2], hira: match[3], number: match[4] }
    : { region: "", classNum: "", hira: "", number: "" };
}

export type VehicleSnapshot = {
  plateRegion: string; plateClassNum: string; plateHira: string; plateNumber: string; vehicleNumber: string;
};

/** 部品の編集と合成車番を一緒に保存し、検索・一覧・CSVの値を一致させる。 */
export function vehicleSnapshotUpdate(current: VehicleSnapshot, input: Partial<VehicleSnapshot>): Partial<VehicleSnapshot> {
  const keys = ["plateRegion", "plateClassNum", "plateHira", "plateNumber"] as const;
  if (input.vehicleNumber === undefined && !keys.some(key => input[key] !== undefined)) return {};
  const parsed = parseVehicleNumber(input.vehicleNumber ?? current.vehicleNumber);
  const fromString = { plateRegion: parsed.region, plateClassNum: parsed.classNum, plateHira: parsed.hira, plateNumber: parsed.number };
  const base = input.vehicleNumber !== undefined ? fromString : {
    plateRegion: current.plateRegion || parsed.region, plateClassNum: current.plateClassNum || parsed.classNum,
    plateHira: current.plateHira || parsed.hira, plateNumber: current.plateNumber || parsed.number,
  };
  const parts = { ...base };
  const stringChanged = input.vehicleNumber !== undefined && input.vehicleNumber !== current.vehicleNumber;
  for (const key of keys) {
    if (input[key] !== undefined && (!stringChanged || input[key] !== current[key])) parts[key] = input[key]!;
  }
  const vehicleNumber = keys.map(key => parts[key]).filter(Boolean).join(" ");
  return { ...parts, vehicleNumber: vehicleNumber || input.vehicleNumber?.trim() || "" };
}
