import { HarnessDocPage } from "@/features/pages/HarnessDocPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { harnessDocPageMetadata as generateMetadata } from "@/features/pages/HarnessDocPage"

/** The article route's framework inputs: the article in the address. */
type PageProps = { readonly params: Promise<{ readonly doc: string }> }

/** The article slot: it hands the article slug to the article page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => <HarnessDocPage slug={(await props.params).doc} />

export default Page
