import { getTranslations } from "next-intl/server"
import { LoadingNotice } from "@starci-next/ui"
import type { ReactElement } from "react"

/** Shown while a route of the landing resolves. */
export const LandingLoadingPage = async (): Promise<ReactElement> => {
    const t = await getTranslations("landing.loading")
    return <LoadingNotice label={t("message")} />
}
