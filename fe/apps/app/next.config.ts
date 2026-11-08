import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

/** The request config lives in this app's i18n module; next-intl resolves it from the directory the build runs in. */
const withNextIntl = createNextIntlPlugin("./src/modules/i18n/request.ts")

/** The npm workspace root (three levels above this app): Turbopack resolves the built workspace packages from it, and output tracing is pinned to it. */
const WORKSPACE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..")

/** The core api on a developer host (its compose port): the origin `next dev` proxies to when `CORE_INTERNAL_ORIGIN` is not set. */
const DEV_CORE_ORIGIN = "http://127.0.0.1:3001"

/**
 * The browser calls the back end's doors on the app's own origin (`/api/*` and `/graphql`), so the session cookie is host-only. In production
 * the ingress routes those paths to the core api before the request reaches this app; the dev server has no ingress, so only `next dev`
 * proxies them to the core api at `CORE_INTERNAL_ORIGIN` (server-side only, never shipped to a browser). The standalone image bakes no rewrite.
 */
const coreRewrites = (): { source: string; destination: string }[] => {
    if (process.env.NODE_ENV !== "development") return []
    const origin = (process.env.CORE_INTERNAL_ORIGIN || DEV_CORE_ORIGIN).replace(/\/+$/, "")
    return [
        { source: "/api/:path*", destination: `${origin}/api/:path*` },
        { source: "/graphql", destination: `${origin}/graphql` },
    ]
}

/** Next config of the product app: the standalone output its image ships, next-intl wired to the request config, root params on (the locale is read from the route), the dev-only core proxy. */
const nextConfig: NextConfig = {
    output: "standalone",
    reactStrictMode: true,
    experimental: { rootParams: true },
    outputFileTracingRoot: WORKSPACE_ROOT,
    turbopack: { root: WORKSPACE_ROOT },
    // The product app is the authenticated one: it does not advertise the framework that serves it.
    poweredByHeader: false,
    rewrites: async () => coreRewrites(),
}

export default withNextIntl(nextConfig)
