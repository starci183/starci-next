import { HarnessBuildsPage } from "@/features/pages/HarnessBuildsPage"

/** The document title of this page, from the catalog of the requested locale. */
export { harnessBuildsPageMetadata as generateMetadata } from "@/features/pages/HarnessBuildsPage"

/** The harness builds slot: it mounts its page and nothing else. */
const Page = () => <HarnessBuildsPage />

export default Page
