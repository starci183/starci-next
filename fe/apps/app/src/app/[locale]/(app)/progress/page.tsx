import { ProgressPage } from "@/features/pages/ProgressPage"

/** The document title of this page, from the catalog of the requested locale. */
export { progressMetadata as generateMetadata } from "@/features/pages/ProgressPage"

/** The progress slot: it mounts its page and nothing else. */
const Page = () => <ProgressPage />

export default Page
