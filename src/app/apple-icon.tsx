import { renderAppIcon } from "@/lib/pwa-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOSのホーム画面用アイコン。角丸はiOS側が自動で付けるため、こちらは
// 正方形のまま（renderAppIconのmaskable指定で角丸なし）で生成する。
export default function AppleIcon() {
  return renderAppIcon(180, { maskable: true });
}
