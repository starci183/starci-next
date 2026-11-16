import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ConnectAi } from "@/components/blocks/ConnectAi"
import type { ReactElement } from "react"

/** The document title of the page, from the catalog of the requested locale. */
export const connectMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.connectAi")
    return { title: t("pageTitle") }
}

/** The connect page (ui.mcp.connect): a server owner that mounts the connection block. */
export const ConnectPage = (): ReactElement => <ConnectAi />
