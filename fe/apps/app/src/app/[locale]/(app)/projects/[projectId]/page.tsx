import { ProjectPage } from "@/features/pages/ProjectPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { projectMetadata as generateMetadata } from "@/features/pages/ProjectPage"

/** The project route's framework inputs: the segment, which names a project. */
type PageProps = { readonly params: Promise<{ readonly projectId: string }> }

/** The project slot: it hands the segment to the project page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => (
    <ProjectPage projectId={(await props.params).projectId} />
)

export default Page
