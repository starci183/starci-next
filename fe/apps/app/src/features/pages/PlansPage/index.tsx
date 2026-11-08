import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { PlansPageBase } from "./component"
import type { ReactElement } from "react"

/** The document title of the plans page, from the catalog of the requested locale. */
export const plansMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.plans")
    return { title: t("documentTitle") }
}

/** The Premium plans page: a server owner that resolves its words and composes the plans block, which reads the offers. */
export const PlansPage = async (): Promise<ReactElement> => {
    const t = await getTranslations("app.plans")
    return <PlansPageBase props={{ title: t("title"), description: t("description") }} />
}
