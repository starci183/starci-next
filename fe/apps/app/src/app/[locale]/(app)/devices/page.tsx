import { DevicesPage } from "@/features/pages/DevicesPage"

/** The document title of this page, from the catalog of the requested locale. */
export { devicesMetadata as generateMetadata } from "@/features/pages/DevicesPage"

/** The devices slot: it mounts its page and nothing else. */
const Page = () => <DevicesPage />

export default Page
