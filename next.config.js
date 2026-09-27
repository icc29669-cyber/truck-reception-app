const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ignoreBuildErrors は使わない: 型エラーは必ず修正してからデプロイする
};
module.exports = withSentryConfig(nextConfig, {
  silent: true,
  hideSourceMaps: true,
  // ブラウザ配信物に .js.map を残さない。エラー通知自体は維持する。
  sourcemaps: { disable: true },
});
