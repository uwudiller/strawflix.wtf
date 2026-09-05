/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint isn't installed in this repo; don't let it block production builds.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;