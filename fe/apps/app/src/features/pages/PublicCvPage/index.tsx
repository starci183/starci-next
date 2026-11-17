import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { PublicCv } from "@/components/blocks/PublicCv"
import type { ReactElement } from "react"

/** What the route hands the page: the segment of the address. */
type PublicCvPageProps = { readonly slug: string }

/** The document title of the page, from the catalog of the requested locale. */
export const publicCvMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.publicCv")
    return { title: t("pageTitle") }
}

/** The public CV page of one learner: a server owner that hands the slug to the public CV block. */
export const PublicCvPage = (props: PublicCvPageProps): ReactElement => <PublicCv slug={props.slug} />
