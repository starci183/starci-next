import { getTranslations } from "next-intl/server"
import { NotFoundNotice } from "@starci-next/ui"
import { staticsBase } from "@/modules/config"
import { APP_ROUTES } from "@/modules/routes"
import type { ReactElement } from "react"

/** Shown when a route of the product app calls `notFound()`: the page-level empty state, its words in the app's locale. */
export const AppNotFoundPage = async (): Promise<ReactElement> => {
    const t = await getTranslations("app.notFound")
    return (
        <NotFoundNotice
            title={t("title")}
            description={t("description")}
            homeLabel={t("home")}
            homeHref={APP_ROUTES.home}
            staticsBaseUrl={staticsBase()}
        />
    )
}
