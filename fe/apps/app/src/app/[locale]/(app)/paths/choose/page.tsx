import { PathsChoosePage } from "@/features/pages/PathsChoosePage"

/** The document title of this page, from the catalog of the requested locale. */
export { pathsChooseMetadata as generateMetadata } from "@/features/pages/PathsChoosePage"

/** The goal page slot: it mounts the outcome path picker and nothing else. */
const Page = () => <PathsChoosePage />

export default Page
