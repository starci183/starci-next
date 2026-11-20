import { currentOf, currentPathOf, lessonRowOf, orderedOf, standingsOf } from "@/hooks/catalog"
import { lessonPartPath, topicPath } from "@/modules/routes"
import type {
    CatalogLessonView,
    CatalogWords,
    LessonPartsView,
    TopicScreenView,
    TopicView,
    TopicWords,
} from "@/modules/types"
import { ESSENTIAL_PARTS } from "@/modules/types"

/** What the topic screen needs besides the topic: the catalog (which names the lessons), where the learner stands and the words. */
type TopicInput = {
    readonly topic: TopicView
    readonly catalog: ReadonlyArray<CatalogLessonView>
    readonly parts: Readonly<Record<string, LessonPartsView>>
    readonly catalogWords: CatalogWords
    readonly words: TopicWords
}

/** The related topics by the title the back end gives them; a topic that is not listed yet is text without a link. */
const relatedOf = (input: TopicInput): TopicScreenView["related"] =>
    input.topic.related.map((topic) => ({
        id: topic.id,
        title: topic.title,
        href: topic.listed ? topicPath(topic.id) : "",
    }))

/** The primary: continue the lesson under way ("part 1" without Premium), else start the first lesson not done. */
const primaryOf = (rows: ReturnType<typeof orderedOf>, input: TopicInput): TopicScreenView["primary"] => {
    const current = currentOf(rows)
    if (current !== undefined)
        return {
            label: input.catalogWords.isPremium ? input.words.resume() : input.words.resumePart(1),
            href: currentPathOf(current),
        }
    const next = rows.find((each) => each.state !== "done") ?? rows[0]
    if (next === undefined) return undefined
    return {
        label: input.words.startFirst,
        href: lessonPartPath(next.lesson.topic.id, next.lesson.id, ESSENTIAL_PARTS[0]),
    }
}

/** The topic screen: the facts, the bar, the lessons in the topic's order and the aside, each block left empty when the data carries nothing for it. */
export const topicScreenOf = (input: TopicInput): TopicScreenView => {
    const inTopic = input.catalog.filter((lesson) => lesson.topic.id === input.topic.id)
    const rows = orderedOf(standingsOf(inTopic, input.parts, input.catalogWords.isPremium), input.topic)
    const current = currentOf(rows)
    const done = rows.filter((each) => each.state === "done").length
    return {
        title: input.topic.title,
        trail: [{ id: "topic", label: input.topic.title }],
        description: input.topic.description,
        facts: input.words.facts(
            rows.length,
            rows.reduce((sum, each) => sum + each.lesson.minutes, 0),
        ),
        primary: primaryOf(rows, input),
        progress: {
            label: input.words.progress(done, rows.length),
            percent: rows.length === 0 ? 0 : Math.round((done / rows.length) * 100),
        },
        notice: input.catalogWords.isPremium ? undefined : input.words.notice,
        rows: rows.map((each) => lessonRowOf(each, input.catalogWords, each.lesson.id === current?.lesson.id, true)),
        parts: input.words.parts.map((part) => ({
            id: part.id,
            title: part.title,
            isLocked: !input.catalogWords.isPremium && !part.isFree,
        })),
        prerequisites: input.topic.prerequisites.map((text) => ({ id: text, title: text, href: "" })),
        related: relatedOf(input),
    }
}
