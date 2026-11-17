"use client"

import { navigation } from "@starci-next/i18n/navigation"
import { DEFAULT_LOCALE } from "@starci-next/i18n/routing"
import { useLocale } from "next-intl"

/**
 * The path the reader is on as the address shows it: the locale-aware pathname with the locale prefix put back (the default
 * language has none), the form the server-resolved hrefs of the chrome and the sign-in return path use.
 */
export const useLocalizedPathname = (): string => {
    const locale = useLocale()
    const pathname = navigation.usePathname()
    if (locale === DEFAULT_LOCALE) return pathname
    return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`
}
