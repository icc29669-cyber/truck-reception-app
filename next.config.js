const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ignoreBuildErrors は使わない: 型エラーは必ず修正してからデプロイする
};
module.exports = withSentryConfig(nextConfig, { silent: true, hideSourceMaps: true });
