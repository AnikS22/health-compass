/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  trailingSlash: process.env.NODE_ENV === "production",
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev"
};

export default nextConfig;
