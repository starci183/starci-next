import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { AgentLab } from "@/components/blocks/AgentLab"
import type { ReactElement } from "react"

/** The document title of the agent lab page, from the catalog of the requested locale. */
export const agentLabMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.agents")
    return { title: t("pageTitle") }
}

/** The agent lab page: a server owner that mounts the block that reads and draws the overview. */
export const AgentLabPage = (): ReactElement => <AgentLab />
