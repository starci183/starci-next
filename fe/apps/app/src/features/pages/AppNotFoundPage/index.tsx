import { getTranslations } from "next-intl/server"
import { NotFoundNotice } from "@starci-next/ui"
import { APP_ROUTES } from "@/modules/routes"
import type { ReactElement } from "react"

/** Shown when a route of the product app calls `notFound()`. */
export const AppNotFoundPage = async (): Promise<ReactElement> => {
    const t = await getTranslations("app.notFound")
    return <NotFoundNotice title={t("title")} homeLabel={t("home")} homeHref={APP_ROUTES.home} />
}
