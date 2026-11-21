import { lessonStateOf, UNTOUCHED_PARTS } from "@/hooks/lessonParts"
import { lessonPartPath, topicPath } from "@/modules/routes"
import {
    ESSENTIAL_PARTS,
    type CatalogFilters,
    type CatalogGroupView,
    type CatalogLessonView,
    type CatalogView,
    type CatalogWords,
    type LessonPartsView,
    type LessonRowView,
    type LessonState,
    type TopicView,
} from "@/modules/types"

/** The value of a filter that filters nothing. */
export const ALL_ID = "all"

/** The filters of a reader who chose nothing. */
export const NO_FILTERS: CatalogFilters = { status: "all", query: "", topic: ALL_ID, plan: "all" }

/** How many lessons of a topic the catalog lists before "see all". */
const LESSONS_SHOWN = 3

/** What the catalog view is built from. */
type CatalogInput = {
    readonly lessons: ReadonlyArray<CatalogLessonView>
    readonly topics: Readonly<Record<string, TopicView>>
    readonly parts: Readonly<Record<string, LessonPartsView>>
    readonly filters: CatalogFilters
    readonly words: CatalogWords
    /** The destination of the plans page, the primary of a reader without Premium. */
    readonly plansHref: string
}

/** One lesson with where the learner stands on it. */
export type Standing = {
    readonly lesson: CatalogLessonView
    readonly parts: LessonPartsView
    readonly state: LessonState
}

/** The lessons of one topic in the topic's own order (the lessons its path names first), the rest in catalog order. */
export const orderedOf = (lessons: ReadonlyArray<Standing>, topic: TopicView | undefined): ReadonlyArray<Standing> => {
    const order = topic?.path.flatMap((row) => (row.lessonId === "" ? [] : [row.lessonId])) ?? []
    const rank = (standing: Standing): number => {
        const index = order.indexOf(standing.lesson.id)
        return index === -1 ? order.length : index
    }
    return lessons.toSorted((a, b) => rank(a) - rank(b))
}

/** The state badge of a lesson: the free line for a reader without Premium, else where the learner stands. */
const badgeOf = (standing: Standing, words: CatalogWords): LessonRowView["badge"] => {
    if (!words.isPremium) return { label: words.state.free, tone: "neutral" }
    if (standing.state === "done") return { label: words.state.done, tone: "success" }
    if (standing.state === "todo") return { label: words.state.todo, tone: "neutral" }
    if (!standing.parts.isUnderWay && standing.parts.doneParts > 0)
        return { label: words.state.partDone(standing.parts.doneParts), tone: "neutral" }
    return { label: words.state.doing(standing.parts.currentPart), tone: "warning" }
}

/** One lesson row, the same on the catalog and on the topic page. */
export const lessonRowOf = (
    standing: Standing,
    words: CatalogWords,
    isCurrent: boolean,
    isWithOpener: boolean,
): LessonRowView => ({
    id: standing.lesson.id,
    title: standing.lesson.title,
    problem: standing.lesson.description,
    href: lessonPartPath(standing.lesson.topic.id, standing.lesson.id, ESSENTIAL_PARTS[0]),
    minutes: words.minutes(standing.lesson.minutes),
    doneParts: standing.parts.doneParts,
    partsLabel: words.partsLabel(standing.parts.doneParts),
    state: standing.state,
    badge: badgeOf(standing, words),
    isCurrent,
    opener: isWithOpener ? words.opener(standing.parts.openerRight, standing.parts.openerAnswered) : "",
})

/** The lessons of the catalog with where the learner stands on each. */
export const standingsOf = (
    lessons: ReadonlyArray<CatalogLessonView>,
    parts: Readonly<Record<string, LessonPartsView>>,
    isPremium: boolean,
): ReadonlyArray<Standing> =>
    lessons.map((lesson) => {
        const own = parts[lesson.id] ?? UNTOUCHED_PARTS
        return { lesson, parts: own, state: lessonStateOf(own, isPremium) }
    })

/** The lesson under way: the first one the learner started and has not finished. */
export const currentOf = (standings: ReadonlyArray<Standing>): Standing | undefined =>
    standings.find((each) => each.state === "doing")

/** The address of the part a lesson is on. */
export const currentPathOf = (standing: Standing): string =>
    lessonPartPath(
        standing.lesson.topic.id,
        standing.lesson.id,
        ESSENTIAL_PARTS[Math.min(Math.max(standing.parts.currentPart, 1), ESSENTIAL_PARTS.length) - 1] ??
            ESSENTIAL_PARTS[0],
    )

/** True when the lesson passes the toolbar: status, topic, plan and the words of its title or problem. */
const matches = (standing: Standing, filters: CatalogFilters): boolean => {
    const needle = filters.query.trim().toLowerCase()
    return (
        (filters.status === "all" || standing.state === filters.status) &&
        (filters.topic === ALL_ID || standing.lesson.topic.id === filters.topic) &&
        (filters.plan === "all" ||
            (filters.plan === "free" ? standing.parts.doneParts === 0 : standing.parts.doneParts > 0)) &&
        (needle === "" || `${standing.lesson.title} ${standing.lesson.description}`.toLowerCase().includes(needle))
    )
}

/** The primary of the band: continue, start the first lesson, or (without Premium) upgrade. */
const primaryOf = (
    standings: ReadonlyArray<Standing>,
    current: Standing | undefined,
    input: CatalogInput,
): CatalogView["primary"] => {
    const { words } = input
    if (!words.isPremium) return { label: words.upgrade, href: input.plansHref }
    if (current !== undefined) return { label: words.resume(), href: currentPathOf(current) }
    const next = standings.find((each) => each.state === "todo") ?? standings[0]
    return next === undefined
        ? undefined
        : {
              label: words.start(),
              href: lessonPartPath(next.lesson.topic.id, next.lesson.id, "essence"),
          }
}

/** The cover card of the lesson under way, with the place of the lesson in its topic. */
const resumeOf = (
    standings: ReadonlyArray<Standing>,
    current: Standing | undefined,
    input: CatalogInput,
): CatalogView["resume"] => {
    if (current === undefined || !input.words.isPremium) return undefined
    const topic = input.topics[current.lesson.topic.id]
    const inTopic = orderedOf(
        standings.filter((each) => each.lesson.topic.id === current.lesson.topic.id),
        topic,
    )
    return {
        lessonId: current.lesson.id,
        kicker: input.words.resumeKicker(
            current.lesson.topic.title,
            inTopic.findIndex((each) => each.lesson.id === current.lesson.id) + 1,
            inTopic.length,
        ),
        title: current.lesson.title,
        doneParts: current.parts.doneParts,
        progressLabel: input.words.resumeProgress(current.parts.currentPart, current.parts.doneParts),
        cta: input.words.resume(),
        href: currentPathOf(current),
    }
}

/** Whole hours and the minutes left over. */
export const hoursOf = (minutes: number): [number, number] => [Math.floor(minutes / 60), minutes % 60]

/** The minutes of a set of lessons. */
export const minutesOf = (standings: ReadonlyArray<Standing>): number =>
    standings.reduce((sum, each) => sum + each.lesson.minutes, 0)

/** The state badge of a topic: done when every lesson is, under way when one was started, else not started. */
const groupBadgeOf = (done: number, all: ReadonlyArray<Standing>, words: CatalogWords): CatalogGroupView["badge"] => {
    if (all.length > 0 && done === all.length) return { label: words.groupState.done, tone: "success" }
    if (done > 0 || all.some((each) => each.state === "doing"))
        return { label: words.groupState.doing, tone: "warning" }
    return { label: words.groupState.todo, tone: "neutral" }
}

/** The four key figures of the band: lessons done, under way, not started and the time left. */
const figuresOf = (standings: ReadonlyArray<Standing>, words: CatalogWords): CatalogView["figures"] => {
    const count = (state: Standing["state"]): number => standings.filter((each) => each.state === state).length
    return [
        { id: "done", term: words.figure.done, value: String(count("done")), unit: `/ ${standings.length}` },
        { id: "doing", term: words.figure.doing, value: String(count("doing")) },
        { id: "todo", term: words.figure.todo, value: String(count("todo")) },
        {
            id: "time",
            term: words.figure.time,
            value: words.hours(...hoursOf(minutesOf(standings.filter((each) => each.state !== "done")))),
        },
    ]
}

/** The groups the catalog lists: one per topic with a lesson that passes the toolbar, each with its bar over all its lessons. */
const groupsOf = (
    standings: ReadonlyArray<Standing>,
    current: Standing | undefined,
    input: CatalogInput,
): ReadonlyArray<CatalogGroupView> => {
    const topicIds = [...new Set(standings.map((each) => each.lesson.topic.id))]
    return topicIds.flatMap((id) => {
        const all = orderedOf(
            standings.filter((each) => each.lesson.topic.id === id),
            input.topics[id],
        )
        const shown = all.filter((each) => matches(each, input.filters))
        if (shown.length === 0) return []
        const done = all.filter((each) => each.state === "done").length
        return [
            {
                id,
                title: all[0]?.lesson.topic.title ?? id,
                progressLabel: input.words.groupProgress(done, all.length),
                done,
                total: all.length,
                href: topicPath(id),
                description: input.topics[id]?.description ?? "",
                metaLabel: input.words.groupMeta(all.length, minutesOf(all)),
                badge: groupBadgeOf(done, all, input.words),
                lessons: shown
                    .slice(0, LESSONS_SHOWN)
                    .map((each) => lessonRowOf(each, input.words, each.lesson.id === current?.lesson.id, false)),
                moreLabel: shown.length > LESSONS_SHOWN ? input.words.viewAll(all.length) : "",
            },
        ]
    })
}

/**
 * The catalog the screen draws: the lessons grouped by topic, the status tabs counted over every lesson (so the three states add up to
 * the total and match the bars of the groups), the groups that pass the toolbar and the one primary.
 */
export const catalogViewOf = (input: CatalogInput): CatalogView => {
    const standings = standingsOf(input.lessons, input.parts, input.words.isPremium)
    const count = (state: LessonState): number => standings.filter((each) => each.state === state).length
    const current = currentOf(standings)
    const topicIds = [...new Set(standings.map((each) => each.lesson.topic.id))]
    return {
        facts:
            count("done") + count("doing") === 0
                ? input.words.factsFirst(topicIds.length, standings.length)
                : input.words.facts(topicIds.length, standings.length, count("done")),
        figures: figuresOf(standings, input.words),
        resume: resumeOf(standings, current, input),
        primary: primaryOf(standings, current, input),
        counts: { all: standings.length, todo: count("todo"), doing: count("doing"), done: count("done") },
        topics: topicIds.map((id) => ({
            id,
            label: standings.find((each) => each.lesson.topic.id === id)?.lesson.topic.title ?? id,
        })),
        groups: groupsOf(standings, current, input),
    }
}
