import { getTranslations } from "next-intl/server"
import { NotFoundNotice } from "@starci-next/ui"
import { staticsBase } from "@/modules/config"
import { LANDING_ROUTES } from "@/modules/routes"
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
