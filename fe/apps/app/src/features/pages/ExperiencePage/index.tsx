import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ExperienceList } from "@/components/blocks/ExperienceList"
import type { ReactElement } from "react"

/** The document title of the page, from the catalog of the requested locale. */
export const experienceMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.experience")
    return { title: t("pageTitle") }
}

/** The experience page (Experience): a server owner that mounts the block that reads and draws the learner's items. */
export const ExperiencePage = (): ReactElement => <ExperienceList />
