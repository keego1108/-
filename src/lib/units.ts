// レシピに書かれた単位（例: 「k」=kg）と、単価表の食材の単位（例: 「g」）が違うときに、
// 使用量を換算するための小さなユーティリティ。

interface UnitInfo {
  // 同じ種類の単位かどうかを見分けるキー（質量=mass・容量=volume・それ以外は単位名そのもの）。
  dimension: string;
  // 基準単位（質量ならg、容量ならml）に直すための倍率。
  factor: number;
}

const MASS: Record<string, number> = {
  kg: 1000,
  k: 1000, // 現場の表記で「k」はkgの意味で使われることが多い
  キロ: 1000,
  キログラム: 1000,
  g: 1,
  グラム: 1,
  mg: 0.001,
};

const VOLUME: Record<string, number> = {
  l: 1000,
  ℓ: 1000,
  リットル: 1000,
  dl: 100,
  ml: 1,
  cc: 1,
  ミリリットル: 1,
};

function normalize(raw: string): string {
  return raw.normalize("NFKC").replace(/\s/g, "").toLowerCase();
}

function parseUnit(raw: string): UnitInfo {
  const unit = normalize(raw);
  if (unit in MASS) return { dimension: "mass", factor: MASS[unit] };
  if (unit in VOLUME) return { dimension: "volume", factor: VOLUME[unit] };
  return { dimension: `other:${unit}`, factor: 1 };
}

// 「100g」「1kg」「1L」のような、数量つきの単位表記を数量と単位に分ける。数量が無ければ1。
export function splitAmountUnit(raw: string): { amount: number; unit: string } {
  const text = raw.normalize("NFKC").trim();
  const match = text.match(/^([\d.,]+)\s*(.*)$/);
  if (!match || !match[2]) return { amount: 1, unit: text };
  const amount = Number(match[1].replace(/,/g, ""));
  return { amount: amount > 0 ? amount : 1, unit: match[2] };
}

// 納品書の単価（例: 「1kgで1,400円」）を、単価表の食材の基準（例: 100gあたり）に直す。
// 換算できない組み合わせ（例: 「個」と「g」）はnullを返す。
export function convertUnitPrice(
  unitPrice: number,
  priceUnitText: string,
  ingredient: { unitQuantity: number; unitLabel: string }
): number | null {
  const { amount, unit } = splitAmountUnit(priceUnitText);
  const basisInPriceUnit = convertQuantity(
    ingredient.unitQuantity,
    ingredient.unitLabel,
    unit
  );
  if (basisInPriceUnit === null) return null;
  return Math.round(((unitPrice * basisInPriceUnit) / amount) * 100) / 100;
}

// 使用量を別の単位に換算する。換算できない組み合わせ（例: 「個」と「g」）はnullを返す。
export function convertQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number | null {
  const from = parseUnit(fromUnit);
  const to = parseUnit(toUnit);
  if (from.dimension !== to.dimension) return null;
  const converted = (quantity * from.factor) / to.factor;
  // 0.07kg → 70.00000000000001g のような浮動小数点の誤差を丸める。
  return Math.round(converted * 1e6) / 1e6;
}
