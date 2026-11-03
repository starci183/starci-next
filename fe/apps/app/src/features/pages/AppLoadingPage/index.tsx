import { getTranslations } from "next-intl/server"
import { LoadingNotice } from "@starci-next/ui"
import type { ReactElement } from "react"

/** Shown while a route of the product app resolves. */
export const AppLoadingPage = async (): Promise<ReactElement> => {
    const t = await getTranslations("app.loading")
    return <LoadingNotice label={t("message")} />
}
