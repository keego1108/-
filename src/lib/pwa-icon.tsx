import { ImageResponse } from "next/og";

// PWAアイコン（ホーム画面追加用）を絵文字ベースで生成する。
// 日本語グリフをSatori（ImageResponseの内部エンジン）で描画するには別途フォント
// ファイルの埋め込みが必要で壊れやすいため、代わりに絵文字（🍽️）を使う。
const BRAND = "#0f6e56";

export function renderAppIcon(
  size: number,
  options?: { maskable?: boolean }
) {
  const maskable = options?.maskable ?? false;
  // maskable（Android等が丸型・角丸などにマスクする）の場合は、絵柄が
  // 切れないよう内側の安全領域（目安: 全体の80%）に収める。
  const padding = Math.round(size * (maskable ? 0.22 : 0.16));
  const borderRadius = maskable ? 0 : Math.round(size * 0.22);
  const emojiSize = size - padding * 2;

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND,
          borderRadius,
        }}
      >
        <div style={{ fontSize: emojiSize, display: "flex", lineHeight: 1 }}>
          🍽️
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
