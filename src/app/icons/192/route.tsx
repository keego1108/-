import { renderAppIcon } from "@/lib/pwa-icon";

// ビルド時に一度だけ生成し、以降はキャッシュされた画像を返す。
export const dynamic = "force-static";

export function GET() {
  return renderAppIcon(192);
}
