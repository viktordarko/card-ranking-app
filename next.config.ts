import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // A link to a route that doesn't exist is a type error.
  typedRoutes: true,
};

export default nextConfig;
