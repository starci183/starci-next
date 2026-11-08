import { lessonStatusOf } from "@/hooks/catalog"
import { lessonPath, topicPath } from "@/modules/routes"
import type { CatalogLessonView, ProgressView, TopicScreenView, TopicView, TopicWords } from "@/modules/types"

/** What the topic screen needs besides the topic: the catalog, which names the lessons and the related topics. */
type TopicInput = {
    readonly topic: TopicView
    readonly catalog: ReadonlyArray<CatalogLessonView>
    readonly progress: Readonly<Record<string, ProgressView>>
    readonly words: TopicWords
}

/** Where the learner stands on a published lesson, or the free line for a reader without Premium. */
const statusOf = (input: TopicInput, lessonId: string): string =>
    input.words.statuses[input.words.isPremium ? lessonStatusOf(input.progress[lessonId]) : "free"]

/** The button words of a published lesson: start, continue or view, by where the learner stands (always view without Premium). */
const ctaOf = (input: TopicInput, lessonId: string): string =>
    input.words.ctas[input.words.isPremium ? lessonStatusOf(input.progress[lessonId]) : "free"]

/** The path of the topic: published lessons link to the lesson and say where the learner stands; the others say they are coming. */
const rowsOf = (input: TopicInput): TopicScreenView["rows"] =>
    input.topic.path.map((row) => {
        const lesson = input.catalog.find((each) => each.id === row.lessonId)
        const isOpen = row.lessonId !== ""
        return {
            id: `${row.order}`,
            title: lesson?.title ?? row.title,
            meta:
                isOpen && lesson !== undefined
                    ? input.words.meta(input.words.difficulty[lesson.difficulty] ?? lesson.difficulty, lesson.minutes)
                    : input.words.pending,
            status: isOpen ? statusOf(input, row.lessonId) : input.words.soon,
            href: isOpen ? lessonPath(input.topic.id, row.lessonId) : "",
            cta: isOpen ? ctaOf(input, row.lessonId) : "",
            isOpen,
        }
    })

/** The related topics by the title the back end gives them; a topic that is not listed yet is text without a link. */
const relatedOf = (input: TopicInput): TopicScreenView["related"] =>
    input.topic.related.map((topic) => ({
        id: topic.id,
        title: topic.title,
        href: topic.listed ? topicPath(topic.id) : "",
    }))

/** The topic screen: the card, the path and the aside, each block left empty when the data carries nothing for it. */
export const topicScreenOf = (input: TopicInput): TopicScreenView => {
    const total = input.topic.path.length
    const open = input.topic.path.filter((row) => row.lessonId !== "").length
    const understood = input.topic.path.filter((row) =>
        ["understood", "proved"].includes(lessonStatusOf(input.progress[row.lessonId])),
    ).length
    return {
        title: input.topic.title,
        group: input.words.groups[input.topic.group] ?? input.topic.group,
        groupId: input.topic.group,
        description: input.topic.description,
        facts: [input.words.openFacts(open, total), input.words.source(input.topic.source)],
        progress: input.words.isPremium ? input.words.progress(understood, total) : "",
        rows: rowsOf(input),
        prerequisites: input.topic.prerequisites.map((text) => ({ id: text, title: text, href: "" })),
        related: relatedOf(input),
    }
}
