"use client"

import { ToastProvider } from "@heroui/react"
import { viewerCacheKey, viewerSwrConfig, type ViewerId } from "@starci/next-data"
import { ThemeProvider } from "next-themes"
import type { ReactNode } from "react"
import { RouterProvider } from "react-aria-components"
import { SWRConfig, useSWRConfig } from "swr"
import { useSignInRedirect } from "@/hooks/auth"
import { useGrammarRouting } from "@/hooks/locale"
import { useViewerId } from "@/hooks/viewer"
import { useAuthSessionEffect } from "@/hooks/effects"
import { SwrSideEffects } from "@/hooks/swr"
import { viewerCache } from "@/modules/viewer-cache"
import { ReduxProvider } from "@/redux"

/** What the app providers wrap: the routed tree. */
type AppProvidersProps = { readonly children: ReactNode }

/**
 * The SWR defaults of the app: no refetch on focus or reconnect (a hook that needs fresh data opts in with its own
 * refreshInterval), duplicate requests collapsed for a minute, at most two retries of a failing key, and no stale data
 * across a key change (the loading state shows instead).
 */
const SWR_DEFAULTS = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60_000,
    errorRetryCount: 2,
    keepPreviousData: false,
} as const

/** The app-wide session effect: modules/auth's session kept in redux. Renders nothing. */
const AuthSessionEffect = (): null => {
    useAuthSessionEffect()
    return null
}

/** Points the writes of viewerCache at the SWR cache around it. Renders nothing. */
const ViewerCacheBinding = (): null => {
    viewerCache.bind(useSWRConfig().mutate)
    return null
}

/**
 * Each viewer gets their own SWR cache (FE-BOUNDARY-3): a change of person remounts the config on a fresh Map, and
 * `viewerSwrConfig` lists pollingRestart so a read whose refreshInterval stopped at 0 polls again for newer data. A read that
 * fails with the stable code of a missing session sends the reader to the sign-in screen (useSignInRedirect).
 */
const renderViewerScope = (viewerId: ViewerId, onError: (error: unknown) => void, children: ReactNode): ReactNode => (
    <SWRConfig key={viewerCacheKey(viewerId)} value={{ ...viewerSwrConfig(SWR_DEFAULTS), onError }}>
        <ViewerCacheBinding />
        <SwrSideEffects />
        {children}
        <ToastProvider />
    </SWRConfig>
)

/** The SWR config of the viewer on screen around the routed tree. */
const ViewerSwrScope = (props: AppProvidersProps): ReactNode =>
    renderViewerScope(useViewerId(), useSignInRedirect(), props.children)

/** The Grammar router context around the tree (see {@link useGrammarRouting}). */
const renderRouting = (routing: ReturnType<typeof useGrammarRouting>, children: ReactNode): ReactNode => (
    <RouterProvider navigate={routing.navigate} useHref={routing.hrefOf}>
        {children}
    </RouterProvider>
)

/** Client routing for Grammar's destinations: an internal row or link is a real anchor that navigates without a reload. */
const GrammarRouting = (props: AppProvidersProps): ReactNode => renderRouting(useGrammarRouting(), props.children)

/**
 * The one client provider stack the locale layout mounts, outer to inner: the theme (light and dark through the `.light` /
 * `.dark` class the grammar and the brand layer read, the system theme by default), the redux store, the session effect, the
 * SWR config keyed by the viewer, the app-wide effects and the HeroUI toast region modules/toast writes to. Each part is
 * composed here, in its one owner.
 */
export const AppProviders = (props: AppProvidersProps) => (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <ReduxProvider>
            <AuthSessionEffect />
            <GrammarRouting>
                <ViewerSwrScope>{props.children}</ViewerSwrScope>
            </GrammarRouting>
        </ReduxProvider>
    </ThemeProvider>
)
