import { HarnessGuidePage } from "@/features/pages/HarnessGuidePage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { harnessGuidePageMetadata as generateMetadata } from "@/features/pages/HarnessGuidePage"

/** The guide route's framework inputs: the guide in the address. */
type PageProps = { readonly params: Promise<{ readonly guide: string }> }

/** The guide slot: it hands the guide slug to the guide page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => <HarnessGuidePage slug={(await props.params).guide} />

export default Page
