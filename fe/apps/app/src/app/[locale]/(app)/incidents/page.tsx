import { IncidentsPage } from "@/features/pages/IncidentsPage"

/** The document title of this page, from the catalog of the requested locale. */
export { incidentsMetadata as generateMetadata } from "@/features/pages/IncidentsPage"

/** The incidents slot: it mounts the incident list page and nothing else. */
const Page = () => <IncidentsPage />

export default Page
