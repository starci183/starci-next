import { ExperiencePage } from "@/features/pages/ExperiencePage"

/** The document title of this page, from the catalog of the requested locale. */
export { experienceMetadata as generateMetadata } from "@/features/pages/ExperiencePage"

/** The experience slot: it mounts its page and nothing else. */
const Page = () => <ExperiencePage />

export default Page
