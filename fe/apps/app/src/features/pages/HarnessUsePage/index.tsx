import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { HarnessUse } from "@/components/blocks/HarnessUse"
import type { ReactElement } from "react"

/** The document title of the Use part page, from the catalog of the requested locale. */
export const harnessUsePageMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.harness.use")
    return { title: t("title") }
}

/** The Use part page: a server owner that mounts the block that reads and draws it. */
export const HarnessUsePage = (): ReactElement => <HarnessUse />
