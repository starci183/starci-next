import { HarnessUsePage } from "@/features/pages/HarnessUsePage"

/** The document title of this page, from the catalog of the requested locale. */
export { harnessUsePageMetadata as generateMetadata } from "@/features/pages/HarnessUsePage"

/** The harness use slot: it mounts its page and nothing else. */
const Page = () => <HarnessUsePage />

export default Page
