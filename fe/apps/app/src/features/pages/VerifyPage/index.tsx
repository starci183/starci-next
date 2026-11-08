import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { VerifyExperience } from "@/components/blocks/VerifyExperience"
import type { ReactElement } from "react"

/** What the route hands the page: the segment of the address. */
type VerifyPageProps = { readonly code: string }

/** The document title of the page, from the catalog of the requested locale. */
export const verifyMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.experience.verify")
    return { title: t("pageTitle") }
}

/** The public verification page of one item: a server owner that hands the code to the verification block. */
export const VerifyPage = (props: VerifyPageProps): ReactElement => <VerifyExperience code={props.code} />
