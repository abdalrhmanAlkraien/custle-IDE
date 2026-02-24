/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Required for Monaco/xterm stability
  transpilePackages: [],
  webpack: (config) => {
    // Needed for some dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
