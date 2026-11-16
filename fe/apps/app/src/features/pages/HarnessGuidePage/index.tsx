import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { HarnessGuide } from "@/components/blocks/HarnessGuide"
import type { ReactElement } from "react"

/** What the route hands the guide page: the guide in the address. */
type HarnessGuidePageProps = { readonly slug: string }

/** The document title of the guide page, from the catalog of the requested locale. */
export const harnessGuidePageMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.harness.guide")
    return { title: t("title") }
}

/** The page of one guide of part 2: a server owner that mounts the block that reads the guide and draws it. */
export const HarnessGuidePage = (props: HarnessGuidePageProps): ReactElement => <HarnessGuide slug={props.slug} />
