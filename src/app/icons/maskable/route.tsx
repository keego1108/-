import { renderAppIcon } from "@/lib/pwa-icon";

export const dynamic = "force-static";

// Android等が丸型・角丸などにマスクして表示する「maskable」アイコン。
export function GET() {
  return renderAppIcon(512, { maskable: true });
}
