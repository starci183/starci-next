import { PublicCvPage } from "@/features/pages/PublicCvPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { publicCvMetadata as generateMetadata } from "@/features/pages/PublicCvPage"

/** The route's framework inputs: the segment. */
type PageProps = { readonly params: Promise<{ readonly slug: string }> }

/** The public CV slot: it hands the segment to its page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => <PublicCvPage slug={(await props.params).slug} />

export default Page
