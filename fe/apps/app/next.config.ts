import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

/** The request config lives in this app's i18n module; next-intl resolves it from the directory the build runs in. */
const withNextIntl = createNextIntlPlugin("./src/modules/i18n/request.ts")

/** The npm workspace root (three levels above this app): Turbopack resolves the built workspace packages from it, and output tracing is pinned to it. */
const WORKSPACE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..")

/**
 * The links of the emailed mails name the doors of the back end service (`/auth/confirm?token=`, `/auth/reset?token=`) on the web origin
 * without a language: they leave for the locale-negotiated confirm and reset pages of this app, the query (the token) kept.
 */
const mailLinkRedirects = (): { source: string; destination: string; permanent: boolean }[] => [
    { source: "/auth/confirm", destination: "/sign-in/confirm", permanent: false },
    { source: "/auth/reset", destination: "/sign-in/reset", permanent: false },
]

/**
 * Essentials v2 became the one Essentials (owner, 2026-11-26): every old `/essentials-v2/...` address, with or without the `en` prefix,
 * leaves for the same path under `/essentials` for good, the query (`?page=`, `?case=`) kept.
 */
const essentialsV2Redirects = (): { source: string; destination: string; permanent: boolean }[] => [
    { source: "/essentials-v2", destination: "/essentials", permanent: true },
    { source: "/essentials-v2/:path*", destination: "/essentials/:path*", permanent: true },
    { source: "/:locale(vi|en)/essentials-v2", destination: "/:locale/essentials", permanent: true },
    { source: "/:locale(vi|en)/essentials-v2/:path*", destination: "/:locale/essentials/:path*", permanent: true },
]

/** Next config of the product app: the standalone output its image ships, next-intl wired to the request config (the locale is read from the route through `next/root-params`, on by default since Next 16.4), the redirects of the emailed links and of the old Essentials v2 addresses. */
const nextConfig: NextConfig = {
    output: "standalone",
    // `next dev` refuses its dev resources and HMR socket to a host other than localhost; the tunnel hosts of the dev stack are named by `NEXT_DEV_ALLOWED_ORIGINS` (comma separated), unset elsewhere.
    allowedDevOrigins: (process.env.NEXT_DEV_ALLOWED_ORIGINS ?? "").split(",").filter((host) => host !== ""),
    reactStrictMode: true,
    outputFileTracingRoot: WORKSPACE_ROOT,
    turbopack: { root: WORKSPACE_ROOT },
    // The product app is the authenticated one: it does not advertise the framework that serves it.
    poweredByHeader: false,
    redirects: async () => [...mailLinkRedirects(), ...essentialsV2Redirects()],
}

export default withNextIntl(nextConfig)
