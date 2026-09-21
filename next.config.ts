import type { NextConfig } from "next";

// Next's own bootstrap scripts, the theme script and the HTML/CSS/JS preview (an inline srcdoc
// frame) are inline, so scripts need 'unsafe-inline'. Dev mode also needs 'unsafe-eval'.
// ponytail: no nonces; move to a nonce-based CSP in proxy.ts if third-party scripts ever get added.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // The dev indicator adds its own DOM to every page, which would pollute axe runs on the harness.
  devIndicators: false,
  poweredByHeader: false,
  // Pages and the registry route read /registry with fs at request time; make sure it ships.
  outputFileTracingIncludes: { "/**": ["./registry/**/*"] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
      {
        // shadcn CLI and other tools fetch registry items from anywhere.
        source: "/r/:name*",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ];
  },
};

export default nextConfig;
