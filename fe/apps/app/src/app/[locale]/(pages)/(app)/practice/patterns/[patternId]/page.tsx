import { PracticePatternPage } from "@/features/pages/PracticePatternPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { practicePatternMetadata as generateMetadata } from "@/features/pages/PracticePatternPage"

/** The pattern route's framework inputs: the segment, which names a pattern. */
type PageProps = { readonly params: Promise<{ readonly patternId: string }> }

/** The pattern slot: it hands the segment to the pattern page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => (
    <PracticePatternPage patternId={(await props.params).patternId} />
)

export default Page
