import { ProfilePage } from "@/features/pages/ProfilePage"

/** The document title of this page, from the catalog of the requested locale. */
export { profileMetadata as generateMetadata } from "@/features/pages/ProfilePage"

/** The profile slot: it mounts its page and nothing else. */
const Page = () => <ProfilePage />

export default Page
