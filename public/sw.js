// 最小限のService Worker。
// このアプリはログイン状態や店舗データが常に変わるため、あえて何もキャッシュしない
// （オフライン対応はしない）。Chrome等が「ホーム画面に追加/インストール」を
// 案内する条件としてfetchイベントの購読が必要なため、その条件を満たすためだけに存在する。
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // 何もしない＝常に通常通りネットワークから取得させる。
});
