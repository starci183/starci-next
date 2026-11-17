import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { PracticeSolve } from "@/components/blocks/PracticeSolve"
import type { ReactElement } from "react"

/** What the route hands the solve page: the problem in the address. */
type PracticeSolvePageProps = { readonly slug: string }

/** The document title of the solve page, from the catalog of the requested locale. */
export const practiceSolveMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.practice.solve")
    return { title: t("pageTitle") }
}

/** The solve page of one problem: a server owner that mounts the block that reads it and keeps the learner's work. */
export const PracticeSolvePage = (props: PracticeSolvePageProps): ReactElement => (
    <PracticeSolve key={props.slug} slug={props.slug} />
)
