import { PlansPage } from "@/features/pages/PlansPage"

/** The document title of this page, from the catalog of the requested locale. */
export { plansMetadata as generateMetadata } from "@/features/pages/PlansPage"

/** The locale's Premium plans slot: it mounts the plans page and nothing else. */
const Page = () => <PlansPage />

export default Page
