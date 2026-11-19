/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  devIndicators: false,
  serverExternalPackages: ["@libsql/client"],
  async headers() {
    return [
      {
        source: "/rooms/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};
export default nextConfig;
