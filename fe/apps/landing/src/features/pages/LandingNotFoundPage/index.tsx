import { getLocale, getTranslations } from "next-intl/server"
import { NotFoundNotice } from "@starci-next/ui"
import { staticsBase } from "@/modules/config"
import { LANDING_ROUTES } from "@/modules/routes"
import type { Metadata } from "next"
import type { ReactElement } from "react"

/** Shown when a route of the landing calls `notFound()`: the page-level empty state, its words in the visitor's locale. */
export const LandingNotFoundPage = async (): Promise<ReactElement> => {
    const t = await getTranslations("landing.notFound")
    return (
        <NotFoundNotice
            title={t("title")}
            description={t("description")}
            homeLabel={t("home")}
            homeHref={LANDING_ROUTES.home}
            staticsBaseUrl={staticsBase()}
        />
    )
}

/** The document title of a missing address, for the language in the address (the current request's language when none is given). */
export const landingNotFoundMetadata = async (locale?: string): Promise<Metadata> => {
    const t = await getTranslations({ locale: locale ?? (await getLocale()), namespace: "landing.notFound" })
    return { title: t("documentTitle") }
}
