import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {};

export default withPWA({
  ...nextConfig,
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
  },
});
