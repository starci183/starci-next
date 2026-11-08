import type { DataSlot } from "@starci-next/ui"
import type { TopicLabels, TopicScreenView } from "./topic"
import { trailHeaderOf, type TrailHeaderPart } from "./trailHeader"

/** The page header of a topic: its title and the trail "catalog / group / topic"; the placeholder's while the first read runs, none for any other status. */
export const topicHeaderOf = (
    slot: DataSlot<TopicScreenView>,
    placeholder: TopicScreenView,
    labels: Pick<TopicLabels, "breadcrumbs" | "pageTitle">,
    catalogHref: string,
): TrailHeaderPart =>
    trailHeaderOf(slot, placeholder, labels.breadcrumbs, (topic) => ({
        title: topic.title,
        items: [
            { id: "essentials", label: labels.pageTitle, href: catalogHref },
            { id: "group", label: topic.group },
            { id: "topic", label: topic.title },
        ],
    }))
