import { ReviewDeckPage } from "@/features/pages/ReviewDeckPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { reviewDeckMetadata as generateMetadata } from "@/features/pages/ReviewDeckPage"

/** The deck route's framework inputs: the segment, which names a deck. */
type PageProps = { readonly params: Promise<{ readonly deckId: string }> }

/** The deck slot: it hands the segment to the deck page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => <ReviewDeckPage deckId={(await props.params).deckId} />

export default Page
