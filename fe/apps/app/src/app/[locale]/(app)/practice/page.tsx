import { PracticeCatalogPage } from "@/features/pages/PracticeCatalogPage"

/** The document title of this page, from the catalog of the requested locale. */
export { practiceCatalogMetadata as generateMetadata } from "@/features/pages/PracticeCatalogPage"

/** The Practice code slot: it mounts the patterns page and nothing else. */
const Page = () => <PracticeCatalogPage />

export default Page
