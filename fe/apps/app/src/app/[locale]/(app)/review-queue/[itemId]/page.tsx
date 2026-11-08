import { ReviewItemPage } from "@/features/pages/ReviewItemPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { reviewItemMetadata as generateMetadata } from "@/features/pages/ReviewItemPage"

/** The route's framework inputs: the segment. */
type PageProps = { readonly params: Promise<{ readonly itemId: string }> }

/** The review item slot: it hands the segment to its page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => <ReviewItemPage itemId={(await props.params).itemId} />

export default Page
