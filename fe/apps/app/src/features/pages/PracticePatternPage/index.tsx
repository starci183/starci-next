import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { PracticePattern } from "@/components/blocks/PracticePattern"
import type { ReactElement } from "react"

/** What the route hands the pattern page: the segment of the address. */
type PracticePatternPageProps = { readonly patternId: string }

/** The document title of the pattern page, from the catalog of the requested locale. */
export const practicePatternMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.practice.pattern")
    return { title: t("pageTitle") }
}

/** The pattern page: a server owner that mounts the block that reads the pattern's problems. */
export const PracticePatternPage = (props: PracticePatternPageProps): ReactElement => (
    <PracticePattern patternId={props.patternId} />
)
