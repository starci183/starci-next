import { HarnessHubPage } from "@/features/pages/HarnessHubPage"

/** The document title of this page, from the catalog of the requested locale. */
export { harnessHubPageMetadata as generateMetadata } from "@/features/pages/HarnessHubPage"

/** The harness hub slot: it mounts its page and nothing else. */
const Page = () => <HarnessHubPage />

export default Page
