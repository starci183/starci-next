import { TopicPage } from "@/features/pages/TopicPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { topicPageMetadata as generateMetadata } from "@/features/pages/TopicPage"

/** The topic route's framework inputs: the segment, which names a topic (or, in an old link, a lesson). */
type PageProps = { readonly params: Promise<{ readonly topic: string }> }

/** The topic slot: it hands the segment to the topic page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => <TopicPage topicId={(await props.params).topic} />

export default Page
