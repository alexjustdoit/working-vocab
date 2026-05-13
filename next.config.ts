import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  // Use webpack instead of Turbopack (next-pwa compatibility)
  experimental: {
    turbopack: false,
  },
};

export default withPWA({
  ...nextConfig,
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
  },
});
