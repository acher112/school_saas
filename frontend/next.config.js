/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
  async rewrites() {
    const rawBackendUrl =
      process.env.BACKEND_INTERNAL_URL ||
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";
    const backendUrl = rawBackendUrl.replace(/\/+$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/owner",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/owner/:path*",
        destination: "/admin/:path*",
        permanent: false,
      },
      {
        source: "/org_admin",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/org_admin/:path*",
        destination: "/admin/:path*",
        permanent: false,
      },
      {
        source: "/principal",
        destination: "/headmaster",
        permanent: false,
      },
      {
        source: "/principal/:path*",
        destination: "/headmaster/:path*",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
