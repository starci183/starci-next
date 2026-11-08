import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { IncidentsList } from "@/components/blocks/IncidentsList"
import type { ReactElement } from "react"

/** The document title of the incident list page, from the catalog of the requested locale. */
export const incidentsMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.incidents")
    return { title: t("pageTitle") }
}

/** The incident list page: a server owner that mounts the block that reads and draws the list. */
export const IncidentsPage = (): ReactElement => <IncidentsList />
