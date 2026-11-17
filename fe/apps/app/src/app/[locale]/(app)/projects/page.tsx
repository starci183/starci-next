import { ProjectsPage } from "@/features/pages/ProjectsPage"

/** The document title of this page, from the catalog of the requested locale. */
export { projectsMetadata as generateMetadata } from "@/features/pages/ProjectsPage"

/** The projects slot: it mounts the projects page and nothing else. */
const Page = () => <ProjectsPage />

export default Page
