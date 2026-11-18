import { notFound } from "next/navigation"
import { appNotFoundMetadata } from "@/features/pages/AppNotFoundPage"
import type { Metadata } from "next"

type PageProps = { readonly params: Promise<{ readonly locale: string }> }

/** The localized document title of a missing address. */
export const generateMetadata = async (props: PageProps): Promise<Metadata> =>
    appNotFoundMetadata((await props.params).locale)

/** The catch-all slot: an address under a locale that no route matches is a missing page, drawn by the locale's own not-found. */
const Page = (): never => notFound()

export default Page
