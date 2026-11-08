import { ProjectNewPage } from "@/features/pages/ProjectNewPage"

/** The document title of this page, from the catalog of the requested locale. */
export { projectNewMetadata as generateMetadata } from "@/features/pages/ProjectNewPage"

/** The new-project slot: it mounts the new-project page and nothing else. */
const Page = () => <ProjectNewPage />

export default Page
