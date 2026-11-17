import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { InterviewHome } from "@/components/blocks/InterviewHome"
import type { ReactElement } from "react"

/** The document title of the interview home, from the catalog of the requested locale. */
export const interviewMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.interview")
    return { title: t("pageTitle") }
}

/** The interview home page: a server owner that mounts the block that reads and draws the setup and the history. */
export const InterviewPage = (): ReactElement => <InterviewHome />
