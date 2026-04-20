const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
};
module.exports = withSentryConfig(nextConfig, { silent: true, hideSourceMaps: true });
