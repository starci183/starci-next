import type { Metadata } from "next"
import { PublicCvPage, publicCvMetadata } from "@/features/pages/PublicCvPage"
import type { ReactElement } from "react"

/** The route's framework inputs: the segment. */
type PageProps = { readonly params: Promise<{ readonly slug: string }> }

/** The document head of this page: the owner's name and count, the preview image, and noindex. */
export const generateMetadata = async (props: PageProps): Promise<Metadata> => publicCvMetadata(await props.params)

/** The public CV slot: it hands the segment to its page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => <PublicCvPage slug={(await props.params).slug} />

export default Page
