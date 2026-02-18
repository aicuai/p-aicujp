import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@aicujp/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/R2602", destination: "/q/R2602", permanent: false },
      { source: "/R2602/:path*", destination: "/q/R2602/:path*", permanent: false },
    ]
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    ]
    const corsHeaders = [
      { key: "Access-Control-Allow-Origin", value: "https://aicu.jp" },
      { key: "Access-Control-Allow-Methods", value: "POST, OPTIONS" },
      { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
    ]
    const corsHeadersMultiOrigin = [
      { key: "Access-Control-Allow-Origin", value: "*" },
      { key: "Access-Control-Allow-Methods", value: "POST, OPTIONS" },
      { key: "Access-Control-Allow-Headers", value: "Content-Type" },
    ]
    return [
      // Security headers for all pages
      { source: "/:path*", headers: securityHeaders },
      // CORS for API routes
      { source: "/api/push/:path*", headers: corsHeaders },
      { source: "/api/profile/:path*", headers: corsHeaders },
      { source: "/api/surveys/:path*", headers: corsHeaders },
      { source: "/api/mail/:path*", headers: corsHeaders },
      { source: "/api/event/:path*", headers: corsHeaders },
      { source: "/api/chatwoot/hmac", headers: corsHeadersMultiOrigin },
    ]
  },
}

export default nextConfig
