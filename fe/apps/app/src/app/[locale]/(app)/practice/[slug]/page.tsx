import { PracticeSolvePage } from "@/features/pages/PracticeSolvePage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { practiceSolveMetadata as generateMetadata } from "@/features/pages/PracticeSolvePage"

/** The solve route's framework inputs: the segment, which names a problem. */
type PageProps = { readonly params: Promise<{ readonly slug: string }> }

/** The solve slot: it hands the segment to the solve page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => <PracticeSolvePage slug={(await props.params).slug} />

export default Page
