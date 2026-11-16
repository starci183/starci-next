import { ConnectPage } from "@/features/pages/ConnectPage"

/** The document title of this page, from the catalog of the requested locale. */
export { connectMetadata as generateMetadata } from "@/features/pages/ConnectPage"

/** The connect slot: it mounts its page and nothing else. */
const Page = () => <ConnectPage />

export default Page
