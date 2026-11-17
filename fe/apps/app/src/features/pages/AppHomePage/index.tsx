import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { LearnHub } from "@/components/blocks/LearnHub"
import type { ReactElement } from "react"

/** The document title of the home page, the learn hub, from the catalog of the requested locale. */
export const appHomeMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.hub")
    return { title: t("pageTitle") }
}

/** The first page of the product app: the learn hub (streak, today and the learning parts). */
export const AppHomePage = (): ReactElement => <LearnHub />
