import { getTranslations } from "next-intl/server"
import { NotFoundNotice } from "@starci-next/ui"
import { LANDING_ROUTES } from "@/modules/routes"
import type { ReactElement } from "react"

/** Shown when a route of the landing calls `notFound()`. */
export const LandingNotFoundPage = async (): Promise<ReactElement> => {
    const t = await getTranslations("landing.notFound")
    return <NotFoundNotice title={t("title")} homeLabel={t("home")} homeHref={LANDING_ROUTES.home} />
}
