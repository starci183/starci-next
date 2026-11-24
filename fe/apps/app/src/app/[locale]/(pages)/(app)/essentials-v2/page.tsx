import { CourseCatalogPage } from "@/features/pages/CourseCatalogPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { courseCatalogPageMetadata as generateMetadata } from "@/features/pages/CourseCatalogPage"

/** The Essentials v2 slot: it hands nothing to the catalog page. */
const Page = (): ReactElement => <CourseCatalogPage />

export default Page
