import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { HarnessBuild } from "@/components/blocks/HarnessBuild"
import type { ReactElement } from "react"

/** What the route hands the build page: the build in the address and the raw `stage` query. */
type HarnessBuildPageProps = {
    readonly buildId: string
    readonly stage: string | undefined
}

/** The document title of the build page, from the catalog of the requested locale. */
export const harnessBuildPageMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.harness.build")
    return { title: t("title") }
}

/** The page of one build of part 1: a server owner that mounts the block that reads the build and draws its stages. */
export const HarnessBuildPage = (props: HarnessBuildPageProps): ReactElement => (
    <HarnessBuild buildId={props.buildId} stage={props.stage} />
)
