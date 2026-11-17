import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { HarnessDoc } from "@/components/blocks/HarnessDoc"
import type { ReactElement } from "react"

/** What the route hands the article page: the article in the address. */
type HarnessDocPageProps = { readonly slug: string }

/** The document title of the article page, from the catalog of the requested locale. */
export const harnessDocPageMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.harness.doc")
    return { title: t("title") }
}

/** The page of one article of part 3: a server owner that mounts the block that reads the article and draws it. */
export const HarnessDocPage = (props: HarnessDocPageProps): ReactElement => <HarnessDoc slug={props.slug} />
