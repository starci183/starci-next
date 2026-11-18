import { VerifyPage } from "@/features/pages/VerifyPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { verifyMetadata as generateMetadata } from "@/features/pages/VerifyPage"

/** The route's framework inputs: the segment. */
type PageProps = { readonly params: Promise<{ readonly code: string }> }

/** The public verification slot: it hands the segment to its page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => <VerifyPage code={(await props.params).code} />

export default Page
