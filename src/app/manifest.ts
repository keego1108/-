import type { MetadataRoute } from "next";

// /manifest.webmanifest として自動配信される（Next.jsが<head>への
// <link rel="manifest">も自動で追加する）。
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "食材・原価管理",
    short_name: "食材・原価管理",
    description: "食材の単価・原価・在庫をまとめて管理するツール",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f6",
    theme_color: "#0f6e56",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
