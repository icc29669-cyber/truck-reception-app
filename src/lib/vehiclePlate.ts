/** 保存済み車番（空白あり・なし）を受付のプレート4項目に戻す。 */
export function parseVehicleNumber(value: string) {
  const compact = value.normalize("NFKC").replace(/[\s・･.\-]/g, "");
  const match = compact.match(/^([^\d]+?)([0-9A-Z]{1,4})([ぁ-んA-Za-z])(\d{1,4})$/);
  return match
    ? { region: match[1], classNum: match[2], hira: match[3], number: match[4] }
    : { region: "", classNum: "", hira: "", number: "" };
}
