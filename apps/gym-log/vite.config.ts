import { defineConfig, type Plugin } from "vite";

// 公開版だけに、外部への通信と外部スクリプトを禁じる CSP を入れる（開発サーバーの HMR を妨げないため）
const csp: Plugin = {
  name: "gym-log-csp",
  apply: "build",
  transformIndexHtml(html) {
    const policy = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "manifest-src 'self'",
      "worker-src 'self'",
      "base-uri 'self'",
      "form-action 'none'",
      "object-src 'none'",
    ].join("; ");
    return html.replace(
      "<head>",
      `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
    );
  },
};

// base: "./" で相対パス出力 → GitHub Pages や任意のサブパスにそのまま置ける
export default defineConfig({
  base: "./",
  plugins: [csp],
});
