"use client"

import { navigation } from "@starci-next/i18n/navigation"
import { i18n } from "@starci-next/i18n/routing"
import { useLocale, useTranslations } from "next-intl"
import { useTransition } from "react"

/** One language the switch offers: its code, short mark and spoken name. */
type LocaleOption = {
    readonly value: string
    readonly label: string
    readonly name: string
}

/** What a language switch needs: the words, the current language, whether a change runs and the command that makes one. */
type LocaleChoice = {
    readonly label: string
    readonly locale: string
    readonly options: ReadonlyArray<LocaleOption>
    readonly isPending: boolean
    readonly choose: (next: string) => void
}

/** The language the product serves that `value` names, or undefined when it serves none such. */
const servedLocaleOf = (value: string): (typeof i18n.locales)[number] | undefined =>
    i18n.locales.find((served) => served === value)

/**
 * Moves the reader to the same page in another language: the language is part of the address (`/en/premium`; the default `vi`
 * has none), so the current path and query are kept and only the language segment changes.
 */
export const useLocaleSwitch = (): LocaleChoice => {
    const t = useTranslations("app.shell")
    const locale = useLocale()
    const router = navigation.useRouter()
    const pathname = navigation.usePathname()
    const [isPending, startTransition] = useTransition()
    return {
        label: t("languageLabel"),
        locale,
        options: [
            { value: "vi", label: t("localeShortVi"), name: t("localeNameVi") },
            { value: "en", label: t("localeShortEn"), name: t("localeNameEn") },
        ],
        isPending,
        choose: (next) => {
            const served = servedLocaleOf(next)
            if (next === locale || served === undefined) return
            const target = pathname + window.location.search + window.location.hash
            startTransition(() => router.replace(target, { locale: served }))
        },
    }
}
