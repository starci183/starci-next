import { InterviewReportPage } from "@/features/pages/InterviewReportPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { interviewReportMetadata as generateMetadata } from "@/features/pages/InterviewReportPage"

/** The report route's framework inputs: the segment, which names a session. */
type PageProps = { readonly params: Promise<{ readonly sessionId: string }> }

/** The report slot: it hands the segment to the report page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => (
    <InterviewReportPage sessionId={(await props.params).sessionId} />
)

export default Page
