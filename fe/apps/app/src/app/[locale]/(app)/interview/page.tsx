import { InterviewPage } from "@/features/pages/InterviewPage"

/** The document title of this page, from the catalog of the requested locale. */
export { interviewMetadata as generateMetadata } from "@/features/pages/InterviewPage"

/** The interview slot: it mounts the interview home page and nothing else. */
const Page = () => <InterviewPage />

export default Page
