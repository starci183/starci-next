import { ProjectMilestonePage } from "@/features/pages/ProjectMilestonePage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { projectMilestoneMetadata as generateMetadata } from "@/features/pages/ProjectMilestonePage"

/** The milestone route's framework inputs: the segments, which name a project and one of its milestones. */
type PageProps = { readonly params: Promise<{ readonly projectId: string; readonly milestoneId: string }> }

/** The milestone slot: it hands the segments to the milestone page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => {
    const { projectId, milestoneId } = await props.params
    return <ProjectMilestonePage projectId={projectId} milestoneId={milestoneId} />
}

export default Page
