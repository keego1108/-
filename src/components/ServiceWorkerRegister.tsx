"use client";

import { useEffect } from "react";

// ホーム画面への追加（PWAインストール）を可能にするための最小限のService Worker登録。
// 表示には影響しない（何も描画しない）。
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // 登録に失敗しても通常のWebアプリとしては問題なく動作するため無視する。
      });
    }
  }, []);

  return null;
}
