"use client"

import { navigation } from "@starci-next/i18n/navigation"
import { DEFAULT_LOCALE } from "@starci-next/i18n/routing"
import { useLocale } from "next-intl"

/** What Grammar's destinations need to navigate inside the app: the press, and the address an anchor shows. */
type GrammarRouting = {
    /** Goes to an app path through the locale-aware router (no reload). */
    readonly navigate: (href: string) => void
    /** The href an anchor renders: an app path carries the prefix of a non-default locale, so copy-link and open-in-new-tab keep the language. */
    readonly hrefOf: (href: string) => string
}

/** True for an app path (one leading slash) that a locale prefix may precede. */
const isAppPath = (href: string): boolean => href.startsWith("/") && !href.startsWith("//")

/**
 * The routing of Grammar's `Link`, `Button href`, list rows with `href` and breadcrumbs (React Aria's router context, 0.37.14): an internal
 * row is a real anchor that navigates client-side; the locale prefix of the anchor follows the page's language.
 */
export const useGrammarRouting = (): GrammarRouting => {
    const router = navigation.useRouter()
    const locale = useLocale()
    const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`
    return {
        navigate: (href) => router.push(href),
        hrefOf: (href) => {
            if (prefix === "" || !isAppPath(href)) return href
            return href === "/" ? prefix : `${prefix}${href}`
        },
    }
}
