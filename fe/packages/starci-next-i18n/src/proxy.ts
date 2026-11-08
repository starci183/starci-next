import { createProxy, DEFAULT_UNNEGOTIATED_ROOTS, type LocaleProxy } from "@starci/next-i18n/proxy"
import { i18n } from "./routing"

/**
 * The one thing that runs before a route exists: which language it is in. The product's one description of its languages, read by
 * the package's proxy; each app's `src/proxy.ts` re-exports this. `/graphql` is the back end's door on the app's own origin, so no locale is negotiated for it.
 */
export const proxy: LocaleProxy = createProxy(i18n, { unnegotiatedRoots: [...DEFAULT_UNNEGOTIATED_ROOTS, "graphql"] })
