import { AgentLabPage } from "@/features/pages/AgentLabPage"

/** The document title of this page, from the catalog of the requested locale. */
export { agentLabMetadata as generateMetadata } from "@/features/pages/AgentLabPage"

/** The agents slot: it mounts the agent lab page and nothing else. */
const Page = () => <AgentLabPage />

export default Page
