import { EssentialsCatalogPage } from "@/features/pages/EssentialsCatalogPage"

/** The document title of this page, from the catalog of the requested locale. */
export { essentialsCatalogMetadata as generateMetadata } from "@/features/pages/EssentialsCatalogPage"

/** The lessons slot: it mounts the Knowledge Lesson catalog page and nothing else. */
const Page = () => <EssentialsCatalogPage />

export default Page
