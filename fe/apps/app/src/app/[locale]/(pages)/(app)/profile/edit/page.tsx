import { ProfileEditPage } from "@/features/pages/ProfileEditPage"

/** The document title of this page, from the catalog of the requested locale. */
export { profileEditMetadata as generateMetadata } from "@/features/pages/ProfileEditPage"

/** The profile edit slot: it mounts its page and nothing else. */
const Page = () => <ProfileEditPage />

export default Page
