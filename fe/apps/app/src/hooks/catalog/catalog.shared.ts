import { lessonPath } from "@/modules/routes"
import { casesOf, topicsOf } from "@/hooks/catalogTopics"
import { lessonStatusOf } from "@/hooks/lessonStatus"
import {
    LESSON_GROUP_SOURCES,
    LESSON_GROUPS,
    LESSON_SOURCE_TOTAL,
    type CatalogFilters,
    type CatalogLessonView,
    type CatalogTopics,
    type CatalogView,
    type CatalogWords,
    type ProgressView,
} from "@/modules/types"

/** The value of a filter that filters nothing. */
export const ALL_ID = "all"

/** The filters of a reader who chose nothing. */
export const NO_FILTERS: CatalogFilters = {
    group: ALL_ID,
    difficulty: ALL_ID,
    query: "",
    language: ALL_ID,
    provider: ALL_ID,
}

/** The implementation languages the catalog always offers, in the order the canvas lists them. */
export const KNOWN_LANGUAGES: ReadonlyArray<string> = ["typescript", "go", "python", "java"]

/** The cloud providers the catalog always offers, in the order the canvas lists them. */
export const KNOWN_PROVIDERS: ReadonlyArray<string> = ["aws", "gcp", "azure", "digitalocean"]

/** The words of a lesson status: the free line for a reader without Premium, the progress status otherwise. */
const statusWordsOf = (progress: ProgressView | undefined, words: CatalogWords): string =>
    words.statuses[words.isPremium ? lessonStatusOf(progress) : "free"]

/** True when the lesson passes every filter: the group, the difficulty, the words in its title or description, the language and the provider. */
const matches = (lesson: CatalogLessonView, filters: CatalogFilters): boolean => {
    const needle = filters.query.trim().toLowerCase()
    return (
        (filters.group === ALL_ID || lesson.group === filters.group) &&
        (filters.difficulty === ALL_ID || lesson.difficulty === filters.difficulty) &&
        (filters.language === ALL_ID || lesson.languages.some((each) => each.toLowerCase() === filters.language)) &&
        (filters.provider === ALL_ID || lesson.providers.some((each) => each.toLowerCase() === filters.provider)) &&
        (needle === "" || `${lesson.title} ${lesson.description}`.toLowerCase().includes(needle))
    )
}

/** True while a search or a filter other than the group is active: the catalog then lists lesson cards instead of topic cards. */
const isLessonMode = (filters: CatalogFilters): boolean =>
    filters.query.trim() !== "" ||
    filters.difficulty !== ALL_ID ||
    filters.language !== ALL_ID ||
    filters.provider !== ALL_ID

/** The words of an option: the proper name of a value the catalog knows, the value itself otherwise. */
const nameOf = (value: string, names: Readonly<Record<string, string>>): string => names[value] ?? value

/**
 * The options of a filter led by the "all" option: the values the catalog always offers, then any other value the lessons carry,
 * each under its proper name. An option never has a blank label.
 */
const optionsOf = (
    known: ReadonlyArray<string>,
    values: ReadonlyArray<string>,
    names: Readonly<Record<string, string>>,
    all: string,
): CatalogView["languages"] => {
    const extra = [...new Set(values.map((value) => value.toLowerCase()))]
        .filter((value) => value !== "" && !known.includes(value))
        .toSorted((a, b) => a.localeCompare(b))
    return [
        { id: ALL_ID, label: all },
        ...[...known, ...extra].map((value) => ({ id: value, label: nameOf(value, names) })),
    ]
}

/** The lesson cards of a group, one per lesson that passed the filters. */
const cardsOf = (
    lessons: ReadonlyArray<CatalogLessonView>,
    progress: Readonly<Record<string, ProgressView>>,
    words: CatalogWords,
): CatalogView["tree"][number]["cards"] =>
    lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        difficulty: words.difficulty[lesson.difficulty] ?? lesson.difficulty,
        status: statusWordsOf(progress[lesson.id], words),
        facts: [
            words.minutes(lesson.minutes),
            ...lesson.languages.map((each) => nameOf(each.toLowerCase(), words.languageNames)),
            ...lesson.providers.map((each) => nameOf(each.toLowerCase(), words.providerNames)),
        ],
        href: lessonPath(lesson.topic.id, lesson.id),
    }))

/** The lesson a Premium learner left half way, with the phase reached. */
const resumeOf = (
    lessons: ReadonlyArray<CatalogLessonView>,
    progress: Readonly<Record<string, ProgressView>>,
    words: CatalogWords,
): CatalogView["resume"] => {
    if (!words.isPremium) return undefined
    const lesson = lessons.find((each) => lessonStatusOf(progress[each.id]) === "doing")
    if (lesson === undefined) return undefined
    return {
        title: lesson.title,
        phaseLine: words.resume(progress[lesson.id]?.phase ?? ""),
        href: lessonPath(lesson.topic.id, lesson.id, progress[lesson.id]?.phase),
    }
}

/**
 * The catalog the screen draws: the aside counts every published lesson per group; the tree holds one section per group that has a
 * lesson passing the filters, with topic cards by default and lesson cards while a search or a filter is active; the case studies
 * lead the tree while nothing hides them.
 */
export const catalogViewOf = (
    lessons: ReadonlyArray<CatalogLessonView>,
    filters: CatalogFilters,
    progress: Readonly<Record<string, ProgressView>>,
    words: CatalogWords,
    topics: CatalogTopics,
): CatalogView => {
    const shown = lessons.filter((lesson) => matches(lesson, filters))
    const byLesson = isLessonMode(filters)
    return {
        resume: resumeOf(lessons, progress, words),
        total: lessons.length,
        facts: [
            words.published(lessons.length),
            words.groupCount(LESSON_GROUPS.length),
            words.sources(LESSON_SOURCE_TOTAL),
        ],
        groups: LESSON_GROUPS.map((group) => ({
            id: group,
            label: words.groups[group] ?? group,
            count: lessons.filter((lesson) => lesson.group === group).length,
        })),
        languages: optionsOf(
            KNOWN_LANGUAGES,
            lessons.flatMap((lesson) => lesson.languages),
            words.languageNames,
            words.all,
        ),
        providers: optionsOf(
            KNOWN_PROVIDERS,
            lessons.flatMap((lesson) => lesson.providers),
            words.providerNames,
            words.all,
        ),
        cases: casesOf((filters.group === ALL_ID || filters.group === "casestudy") && !isLessonMode(filters), words),
        tree: LESSON_GROUPS.flatMap((group) => {
            const inGroup = shown.filter((lesson) => lesson.group === group)
            if (inGroup.length === 0) return []
            const groupTopics = byLesson ? [] : topicsOf(inGroup, topics, progress, words)
            return [
                {
                    id: group,
                    label: words.groups[group] ?? group,
                    meta: byLesson ? words.matchCount(inGroup.length) : words.topicCount(groupTopics.length),
                    topics: groupTopics,
                    cards: byLesson ? cardsOf(inGroup, progress, words) : [],
                    pending: byLesson
                        ? ""
                        : words.pendingGroup(
                              Math.max(
                                  0,
                                  LESSON_GROUP_SOURCES[group] -
                                      lessons.filter((lesson) => lesson.group === group).length,
                              ),
                          ),
                },
            ]
        }),
    }
}
export { lessonStatusOf } from "@/hooks/lessonStatus"
