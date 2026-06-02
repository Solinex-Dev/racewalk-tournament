import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": ["./node_modules/geothai/**/*"],
  },
};

export default nextConfig;
