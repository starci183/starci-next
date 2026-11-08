import { AgentTrackPage } from "@/features/pages/AgentTrackPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { agentTrackMetadata as generateMetadata } from "@/features/pages/AgentTrackPage"

/** The track route's framework inputs: the segment, which names a tool track. */
type PageProps = { readonly params: Promise<{ readonly trackId: string }> }

/** The track slot: it hands the segment to the track page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => (
    <AgentTrackPage trackId={(await props.params).trackId} />
)

export default Page
