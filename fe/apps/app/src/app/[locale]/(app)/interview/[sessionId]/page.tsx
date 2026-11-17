import { InterviewRoomPage } from "@/features/pages/InterviewRoomPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { interviewRoomMetadata as generateMetadata } from "@/features/pages/InterviewRoomPage"

/** The room route's framework inputs: the segment, which names a session. */
type PageProps = { readonly params: Promise<{ readonly sessionId: string }> }

/** The room slot: it hands the segment to the room page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => (
    <InterviewRoomPage sessionId={(await props.params).sessionId} />
)

export default Page
