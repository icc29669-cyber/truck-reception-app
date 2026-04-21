// ブラウザ/PWA/インアプリブラウザ判定
// クライアント側でのみ呼び出すこと（SSR でも安全に null/false を返す）

export type InAppBrowser = "line" | "facebook" | "messenger" | "instagram" | "twitter" | "tiktok" | "webview" | "other" | null;

export interface BrowserInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;   // PWA としてホーム画面から起動しているか
  inAppBrowser: InAppBrowser;  // LINE / FB / 汎用WebView 等の場合その種別
  inAppName: string | null;    // 表示用名称
  canInstallPwa: boolean;       // PWA インストール可能な環境か（iOS Safari or Android Chrome 等）
  userAgent: string;            // 診断用
}

export function detectBrowser(): BrowserInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isIOS: false, isAndroid: false, isStandalone: false,
      inAppBrowser: null, inAppName: null, canInstallPwa: false, userAgent: "",
    };
  }
  const ua = navigator.userAgent;

  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    (typeof navigator !== "undefined" && navigator.standalone === true);

  let inAppBrowser: InAppBrowser = null;
  let inAppName: string | null = null;

  // 既知のアプリ内蔵ブラウザ
  if (/Line\//.test(ua)) { inAppBrowser = "line"; inAppName = "LINE"; }
  else if (/FBAN|FBAV|FB_IAB|FB4A/.test(ua)) { inAppBrowser = "facebook"; inAppName = "Facebook"; }
  else if (/Messenger/.test(ua)) { inAppBrowser = "messenger"; inAppName = "Messenger"; }
  else if (/Instagram/.test(ua)) { inAppBrowser = "instagram"; inAppName = "Instagram"; }
  else if (/TwitterAndroid|Twitter for/.test(ua)) { inAppBrowser = "twitter"; inAppName = "X (Twitter)"; }
  else if (/Bytedance|musical_ly/.test(ua)) { inAppBrowser = "tiktok"; inAppName = "TikTok"; }

  // Safari 判定
  const isIOSSafari = isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  // iOS 他ブラウザ（Chrome for iOS, Firefox for iOS など）も PWA 制限あり
  const isIOSNonSafari = isIOS && /CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  // Android Chrome / Samsung Browser はフルブラウザ
  const isAndroidChrome = isAndroid && /Chrome|SamsungBrowser|Firefox/.test(ua) && !/; wv\)/.test(ua);
  // Android WebView 判定（QRスキャナー内蔵ブラウザなどを幅広く捕捉）
  const isAndroidWebView = isAndroid && /; wv\)/.test(ua);

  // 未知の WebView も in-app として扱う
  if (!inAppBrowser && isAndroidWebView) {
    inAppBrowser = "webview";
    inAppName = "アプリ内ブラウザ";
  }
  if (!inAppBrowser && isIOSNonSafari) {
    inAppBrowser = "other";
    inAppName = "他のブラウザ";
  }

  const canInstallPwa = !inAppBrowser && (isIOSSafari || isAndroidChrome || (!isIOS && !isAndroid));

  return { isIOS, isAndroid, isStandalone, inAppBrowser, inAppName, canInstallPwa, userAgent: ua };
}
