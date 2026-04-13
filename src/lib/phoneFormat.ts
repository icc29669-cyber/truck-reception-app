/** 電話番号フォーマット（truck-berth-app準拠） */

const MOBILE_PREFIXES = ["070", "080", "090"];

const JP_AREA: Record<string, number> = {
  "0120": 2, "0570": 2, "0800": 2, "0990": 2,
  "0494": 2, "0493": 2, "0492": 2, "0491": 2, "0490": 2,
  "0480": 2, "0479": 2, "0478": 2, "0477": 2, "0476": 2,
  "0475": 2, "0474": 2, "0472": 2, "0471": 2, "0470": 2,
  "0467": 2, "0466": 2, "0465": 2, "0463": 2, "0460": 2,
  "0439": 2, "0438": 2, "0436": 2, "0428": 2, "0426": 2,
  "0267": 2, "0266": 2, "0265": 2, "0264": 2, "0263": 2,
  "0261": 2, "0260": 2, "0259": 2, "0258": 2, "0257": 2,
  "0256": 2, "0255": 2, "0254": 2, "0250": 2,
  "0246": 2, "0244": 2, "0243": 2, "0242": 2, "0241": 2,
  "0240": 2, "0237": 2, "0235": 2, "0234": 2, "0233": 2,
  "0229": 2, "0228": 2, "0227": 2, "0226": 2, "0225": 2,
  "0224": 2, "0223": 2, "0220": 2,
  "0197": 2, "0195": 2, "0194": 2, "0193": 2, "0192": 2,
  "0191": 2, "0187": 2, "0186": 2, "0185": 2, "0184": 2,
  "0183": 2, "0182": 2, "0180": 2, "0179": 2, "0178": 2,
  "0176": 2, "0175": 2, "0174": 2, "0173": 2, "0172": 2,
  "0170": 2, "0167": 2, "0166": 2, "0165": 2, "0164": 2,
  "0163": 2, "0162": 2, "0158": 2, "0157": 2, "0156": 2,
  "0155": 2, "0154": 2, "0153": 2, "0152": 2, "0146": 2,
  "0145": 2, "0144": 2, "0143": 2, "0142": 2, "0135": 2,
  "0134": 2, "0133": 2, "0132": 2, "0125": 2, "0124": 2,
  "0123": 2,
  "011": 3, "012": 3, "013": 3, "014": 3, "015": 3, "016": 3, "017": 3, "018": 3, "019": 3,
  "022": 3, "023": 3, "024": 3, "025": 3, "026": 3, "027": 3, "028": 3, "029": 3,
  "042": 3, "043": 3, "044": 3, "045": 3, "046": 3, "047": 3, "048": 3, "049": 3,
  "052": 3, "053": 3, "054": 3, "055": 3, "056": 3, "057": 3, "058": 3, "059": 3,
  "072": 3, "073": 3, "074": 3, "075": 3, "076": 3, "077": 3, "078": 3, "079": 3,
  "082": 3, "083": 3, "084": 3, "085": 3, "086": 3, "087": 3, "088": 3, "089": 3,
  "092": 3, "093": 3, "094": 3, "095": 3, "096": 3, "097": 3, "098": 3, "099": 3,
  "03": 4, "06": 4, "04": 4,
};

export function isMobilePrefix(digits: string): boolean {
  return MOBILE_PREFIXES.some((p) => digits.startsWith(p));
}

export function fmtPhone(digits: string): string {
  if (!digits) return "";
  if (isMobilePrefix(digits)) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
  for (const areaLen of [4, 3, 2]) {
    const prefix = digits.slice(0, areaLen);
    const midLen = JP_AREA[prefix];
    if (midLen !== undefined) {
      const midEnd = areaLen + midLen;
      if (digits.length <= areaLen) return digits;
      if (digits.length <= midEnd) return `${digits.slice(0, areaLen)}-${digits.slice(areaLen)}`;
      return `${digits.slice(0, areaLen)}-${digits.slice(areaLen, midEnd)}-${digits.slice(midEnd, 10)}`;
    }
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function getJpAreaMap(): Record<string, number> {
  return JP_AREA;
}
