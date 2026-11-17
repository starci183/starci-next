import { ReviewQueuePage } from "@/features/pages/ReviewQueuePage"

/** The document title of this page, from the catalog of the requested locale. */
export { reviewQueueMetadata as generateMetadata } from "@/features/pages/ReviewQueuePage"

/** The review queue slot: it mounts its page and nothing else. */
const Page = () => <ReviewQueuePage />

export default Page
