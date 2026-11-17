import { topicPath } from "@/modules/routes"
import type {
    CatalogLessonView,
    CatalogTopics,
    CatalogView,
    CatalogWords,
    ProgressView,
    TopicView,
} from "@/modules/types"
import { understoodOf } from "@/hooks/lessonStatus"

/** The 3D cover of a chapter: one picture per topic id under public/art/topics. */
export const topicCoverOf = (topicId: string): string => `/art/topics/${topicId}.webp`

/** How many rows of a topic's path a card previews that are not open yet. */
const PREVIEW_PENDING_ROWS = 2

/** The name of a path row in a preview: the part before the dash of a long lesson title. */
const shortTitleOf = (title: string): string => title.split(" — ")[0] ?? title

/** The preview of a topic path: the lessons that are open, then the next few that are still coming. */
const previewOf = (topic: TopicView, words: CatalogWords): CatalogView["tree"][number]["topics"][number]["preview"] => [
    ...topic.path
        .filter((row) => row.lessonId !== "")
        .map((row) => ({ id: `${row.order}`, title: shortTitleOf(row.title), isOpen: true })),
    ...topic.path
        .filter((row) => row.lessonId === "")
        .slice(0, PREVIEW_PENDING_ROWS)
        .map((row) => ({ id: `${row.order}`, title: `${row.title} · ${words.soon}`, isOpen: false })),
]

/** The card of one topic: the path totals and the source when the topic was read, the open lessons alone while it is not. */
const topicCardOf = (
    id: string,
    inTopic: ReadonlyArray<CatalogLessonView>,
    topic: TopicView | undefined,
    progress: Readonly<Record<string, ProgressView>>,
    words: CatalogWords,
): CatalogView["tree"][number]["topics"][number] => {
    const total = topic === undefined || topic.path.length === 0 ? inTopic.length : topic.path.length
    const open = topic === undefined ? inTopic.length : topic.path.filter((row) => row.lessonId !== "").length
    const done = understoodOf(
        inTopic.map((lesson) => lesson.id),
        progress,
    )
    return {
        id,
        eyebrow: words.topicKind,
        title: inTopic[0]?.topic.title ?? id,
        source: topic === undefined || topic.source === "" ? "" : words.source(topic.source),
        openLabel: topic === undefined ? words.topicOpen(inTopic.length) : words.openOfTotal(open, total),
        preview:
            topic === undefined
                ? inTopic.map((lesson) => ({ id: lesson.id, title: shortTitleOf(lesson.title), isOpen: true }))
                : previewOf(topic, words),
        status: words.isPremium ? words.understood(done, total) : words.statuses.free,
        cover: topicCoverOf(id),
        progress: words.isPremium && total > 0 ? Math.round((done / total) * 100) : 0,
        href: topicPath(id),
    }
}

/** The topic cards of a group: the group's lessons gathered by topic, each previewing its path. */
export const topicsOf = (
    lessons: ReadonlyArray<CatalogLessonView>,
    topics: CatalogTopics,
    progress: Readonly<Record<string, ProgressView>>,
    words: CatalogWords,
): CatalogView["tree"][number]["topics"] =>
    [...new Set(lessons.map((lesson) => lesson.topic.id))].map((id) =>
        topicCardOf(
            id,
            lessons.filter((lesson) => lesson.topic.id === id),
            topics[id],
            progress,
            words,
        ),
    )

/** The case-study collection, shown while the group filter allows it and no search or difficulty is active. */
export const casesOf = (isShown: boolean, words: CatalogWords): CatalogView["cases"] => {
    if (!isShown) return undefined
    return {
        title: words.groups.casestudy ?? "casestudy",
        meta: words.casesMeta,
        pending: words.casesPending,
        cards: words.cases.map((each) => ({
            id: each.id,
            title: each.title,
            description: each.needs,
            status: words.soon,
            kind: words.caseBadge,
        })),
    }
}
