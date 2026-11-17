import { lessonStatusOf } from "@/hooks/catalog"
import { topicCoverOf } from "@/hooks/catalogTopics"
import { lessonPath, topicPath } from "@/modules/routes"
import type {
    CatalogLessonView,
    OpenerScoreView,
    ProgressView,
    TopicScreenView,
    TopicView,
    TopicWords,
} from "@/modules/types"

/** How many questions a lesson opener asks. */
const OPENER_SIZE = 5

/** What the topic screen needs besides the topic: the catalog, which names the lessons and the related topics. */
type TopicInput = {
    readonly topic: TopicView
    readonly catalog: ReadonlyArray<CatalogLessonView>
    readonly progress: Readonly<Record<string, ProgressView>>
    readonly words: TopicWords
    /** The five-question opener score of each lesson, by lesson id; a lesson missing here is not taken yet. */
    readonly openers: Readonly<Record<string, OpenerScoreView>>
}

/** The opener score of a lesson in words: right now out of five, or "not taken". */
const openerOf = (input: TopicInput, lessonId: string): string => {
    const score = input.openers[lessonId]
    return input.words.opener(
        score === undefined || score.answered === 0 ? undefined : score.latestCorrect,
        Math.max(OPENER_SIZE, score?.answered ?? 0),
    )
}

/** Where the learner stands on a published lesson, or the free line for a reader without Premium. */
const statusOf = (input: TopicInput, lessonId: string): string =>
    input.words.statuses[input.words.isPremium ? lessonStatusOf(input.progress[lessonId]) : "free"]

/** The button words of a published lesson: start, continue or view, by where the learner stands (always view without Premium). */
const ctaOf = (input: TopicInput, lessonId: string): string =>
    input.words.ctas[input.words.isPremium ? lessonStatusOf(input.progress[lessonId]) : "free"]

/** The state of a ring: done when the server says so, current for the first phase not done, later for the rest. */
const phaseStateOf = (state: "open" | "done", isFirstOpen: boolean): "done" | "current" | "later" => {
    if (state === "done") return "done"
    return isFirstOpen ? "current" : "later"
}

/** The six phases of a lesson as the learner stands on them: done, the first one not done is current, the rest later (Premium only). */
const phasesOf = (input: TopicInput, lessonId: string): NonNullable<TopicScreenView["rows"][number]["phases"]> => {
    const phases = ((input.words.isPremium ? input.progress[lessonId]?.phases : undefined) ?? []).filter(
        (each) => each.phase !== "overview" && each.phase !== "review",
    )
    const firstOpen = phases.findIndex((each) => each.state !== "done")
    return phases.map((each, index) => ({
        id: each.phase,
        label: input.words.phases[each.phase] ?? each.phase,
        state: phaseStateOf(each.state, index === firstOpen),
    }))
}

/** The path of the topic: published lessons link to the lesson and say where the learner stands; the others say they are coming. */
const rowsOf = (input: TopicInput): TopicScreenView["rows"] =>
    input.topic.path.map((row) => {
        const lesson = input.catalog.find((each) => each.id === row.lessonId)
        const isOpen = row.lessonId !== ""
        const phases = isOpen ? phasesOf(input, row.lessonId) : []
        return {
            id: `${row.order}`,
            title: lesson?.title ?? row.title,
            meta:
                isOpen && lesson !== undefined
                    ? input.words.meta(
                          input.words.difficulty[lesson.difficulty] ?? lesson.difficulty,
                          lesson.minutes,
                          openerOf(input, row.lessonId),
                      )
                    : input.words.pending,
            status: isOpen ? statusOf(input, row.lessonId) : input.words.soon,
            href: isOpen ? lessonPath(input.topic.id, row.lessonId) : "",
            cta: isOpen ? ctaOf(input, row.lessonId) : "",
            isOpen,
            ...(phases.length === 0
                ? {}
                : {
                      phases,
                      phasesNote: input.words.phasesNote(
                          phases.filter((each) => each.state === "done").length,
                          phases.length,
                      ),
                  }),
        }
    })

/** The related topics by the title the back end gives them; a topic that is not listed yet is text without a link. */
const relatedOf = (input: TopicInput): TopicScreenView["related"] =>
    input.topic.related.map((topic) => ({
        id: topic.id,
        title: topic.title,
        href: topic.listed ? topicPath(topic.id) : "",
    }))

/** The lesson the hero's command opens: the first open one the learner has not understood yet, else the first open one. */
const nextOf = (input: TopicInput, rows: TopicScreenView["rows"]): TopicScreenView["next"] => {
    const unfinished = input.topic.path.find(
        (path) =>
            path.lessonId !== "" && !["understood", "proved"].includes(lessonStatusOf(input.progress[path.lessonId])),
    )
    const row =
        rows.find((each) => each.id === `${unfinished?.order}`) ?? rows.find((each) => each.isOpen && each.href !== "")
    return row === undefined || row.href === ""
        ? undefined
        : { label: `${row.cta}: ${row.title.split(" — ")[0] ?? row.title}`, href: row.href }
}

/** The facts of the band: lessons and minutes across the lessons the chapter has open (all TypeScript). */
const factsOf = (input: TopicInput): string => {
    const lessons = input.topic.path.flatMap((row) => input.catalog.find((each) => each.id === row.lessonId) ?? [])
    return input.words.facts(
        lessons.length,
        lessons.reduce((sum, lesson) => sum + lesson.minutes, 0),
    )
}

/** The topic screen: the card, the path and the aside, each block left empty when the data carries nothing for it. */
export const topicScreenOf = (input: TopicInput): TopicScreenView => {
    const total = input.topic.path.length
    const understood = input.topic.path.filter((row) =>
        ["understood", "proved"].includes(lessonStatusOf(input.progress[row.lessonId])),
    ).length
    const rows = rowsOf(input)
    return {
        title: input.topic.title,
        group: input.words.groups[input.topic.group] ?? input.topic.group,
        groupId: input.topic.group,
        description: input.topic.description,
        facts: [factsOf(input)],
        cover: topicCoverOf(input.topic.id),
        next: nextOf(input, rows),
        note: input.topic.source === "" ? "" : input.words.source(input.topic.source),
        progress: input.words.isPremium ? input.words.progress(understood, total) : "",
        understood: input.words.isPremium ? understood : 0,
        rows,
        prerequisites: input.topic.prerequisites.map((text) => ({ id: text, title: text, href: "" })),
        related: relatedOf(input),
    }
}
