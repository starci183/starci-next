import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { TopicDetail } from "@/components/blocks/TopicDetail"
import type { ReactElement } from "react"

/** What the route hands the topic page: the segment of the address. */
type TopicPageProps = { readonly topicId: string }

/** The document title of the topic page, from the catalog of the requested locale. */
export const topicPageMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.essentials.topic")
    return { title: t("pageTitle") }
}

/** The topic page: a server owner that mounts the block that reads the topic and draws its path. */
export const TopicPage = (props: TopicPageProps): ReactElement => <TopicDetail topicId={props.topicId} />
