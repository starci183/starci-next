import { HarnessDocsPage } from "@/features/pages/HarnessDocsPage"

/** The document title of this page, from the catalog of the requested locale. */
export { harnessDocsPageMetadata as generateMetadata } from "@/features/pages/HarnessDocsPage"

/** The harness docs slot: it mounts its page and nothing else. */
const Page = () => <HarnessDocsPage />

export default Page
