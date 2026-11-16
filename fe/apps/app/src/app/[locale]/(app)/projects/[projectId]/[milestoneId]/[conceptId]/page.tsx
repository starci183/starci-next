import { ProjectConceptPage } from "@/features/pages/ProjectConceptPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { projectConceptMetadata as generateMetadata } from "@/features/pages/ProjectConceptPage"

/** The concept route's framework inputs: the segments, which name a project, one of its milestones and one of its concepts. */
type PageProps = {
    readonly params: Promise<{
        readonly projectId: string
        readonly milestoneId: string
        readonly conceptId: string
    }>
}

/** The concept slot: it hands the segments to the concept page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => {
    const { projectId, milestoneId, conceptId } = await props.params
    return <ProjectConceptPage projectId={projectId} milestoneId={milestoneId} conceptId={conceptId} />
}

export default Page
