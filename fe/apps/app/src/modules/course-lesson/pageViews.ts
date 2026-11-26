import type { CourseIntroView, CoursePatternView, CourseProductionView } from "@starci-next/ui"
import { diagramOf } from "./diagram"
import { isGreenNow, loopOf, termOf, type CourseCase, type CourseLessonRecord } from "./lesson"
import { localized, type LocalizedText } from "./views"
import type { CourseIntroWords, CoursePatternWords, CourseProductionWords } from "./words"

/** The text of a service or dependency role in the learner's language. */
const roleOf = (role: LocalizedText, locale: string): string => localized(role, locale)

/**
 * The ticked lines of the first page: the record's own `outcomes` (a line names the unhappy case that teaches it, and the last one none), or,
 * for a record that lists none, one line per unhappy case with its title.
 */
const outcomesOf = (
    lesson: CourseLessonRecord,
    words: CourseIntroWords,
    locale: string,
): CourseIntroView["outcomes"] => {
    const titleOf = (id: string | null): string | undefined => {
        const found = lesson.unhappy.find((each) => each.id === id)
        return found === undefined ? undefined : localized(found.title, locale)
    }
    if (lesson.outcomes.length === 0) {
        return lesson.unhappy.map((each) => ({ id: each.id, can: localized(each.title, locale), caseTitle: "" }))
    }
    return lesson.outcomes.map((each, index) => {
        const title = titleOf(each.caseId)
        return {
            id: `outcome-${index}`,
            can: localized(each.can, locale),
            caseTitle: title === undefined ? "" : words.outcomeCase(title),
        }
    })
}

/**
 * The intro page: the interview scene the record opens with, what the learner will be able to do (one ticked line per unhappy case, then
 * the interview answered), the architecture drawn from the record with the technology of each node and the services in words.
 */
export const introViewOf = (lesson: CourseLessonRecord, words: CourseIntroWords, locale: string): CourseIntroView => {
    const { stack, hook } = lesson
    const diagram = diagramOf(lesson, {
        entry: words.entry,
        frame: words.frame,
    })
    return {
        hook:
            hook === null
                ? undefined
                : {
                      when: localized(hook.when, locale),
                      setup: localized(hook.scene, locale),
                      question: localized(hook.question, locale),
                      stumble: localized(hook.stuck, locale),
                      promise: localized(hook.promise, locale),
                  },
        outcomes: outcomesOf(lesson, words, locale),
        diagram: diagram.source,
        services: stack.services.map((service) => ({
            id: service.id,
            title: `${service.id} :${service.port}`,
            description: roleOf(service.role, locale),
        })),
        requires: lesson.requires.map((id) => termOf(lesson, id)),
    }
}

/**
 * The page that names what the learner built: the concept's term (only now), the retelling and the plain definition the record carries
 * (released once every case was green), and a row per unhappy case with the interviewer's question, what the learner did, what the
 * customer gains and the English name, each state read from the newest run.
 */
export const patternViewOf = (
    lesson: CourseLessonRecord,
    cases: ReadonlyArray<CourseCase>,
    words: CoursePatternWords,
    locale: string,
): CoursePatternView => {
    const { recall } = lesson
    return {
        lead: recall === null ? words.lead : localized(recall.title, locale),
        retell: recall === null ? [] : recall.paragraphs.map((each) => localized(each, locale)),
        steps: loopOf(cases, "unhappy").map((each) => ({
            id: each.id,
            question:
                each.spec.question === null
                    ? localized(each.spec.title, locale)
                    : localized(each.spec.question, locale),
            did: each.spec.recap === null ? "" : localized(each.spec.recap.did, locale),
            gain: each.spec.recap === null ? "" : localized(each.spec.recap.gain, locale),
            // The English name serves a Vietnamese reader to search the docs with; an English reader already reads English.
            englishName: locale === "en" || each.spec.recap === null ? "" : each.spec.recap.en,
            // The newest run, not the green of once: a step the learner broke again must not read as done.
            isGreen: isGreenNow(each),
            stateLabel: isGreenNow(each) ? words.greenLabel : words.openLabel,
        })),
    }
}

/**
 * The comparison of the last page with real repositories: a column per unhappy case (its short name, else its title), the learner's own
 * code first, then a row per repository the record lists, each read in one line with its files; undefined when the record lists none.
 */
export const productionViewOf = (
    lesson: CourseLessonRecord,
    words: CourseProductionWords,
    locale: string,
): CourseProductionView | undefined => {
    if (lesson.production.length === 0) return undefined
    const cases = lesson.unhappy
    const columns = cases.map((each) => ({
        id: each.id,
        label: localized(each.title, locale),
    }))
    return {
        columns,
        rows: [
            {
                id: "learner",
                name: words.learner,
                lang: "",
                isLearner: true,
                cells: cases.map((each) => ({ id: each.id, text: words.shows.yes, isMuted: false })),
            },
            ...lesson.production.map((repo) => ({
                id: repo.repo,
                name: repo.repo,
                lang: repo.lang,
                isLearner: false,
                cells: cases.map((each) => {
                    const value = repo.shows.find((entry) => entry.caseId === each.id)?.value
                    const known = value === "yes" || value === "engine" || value === "partial" || value === "manual"
                    const shown = known || value === "no" || value === "unknown" ? value : "unknown"
                    return { id: each.id, text: words.shows[shown], isMuted: !known }
                }),
            })),
        ],
        repos: lesson.production.map((repo) => ({
            id: repo.repo,
            name: repo.repo,
            meta: words.repoMeta(repo.lang, repo.checked ?? undefined),
            note: localized(repo.note, locale),
            files: repo.files.map((file) => ({ path: file.path, url: file.url })),
        })),
        beyond: lesson.closing === null ? "" : localized(lesson.closing.beyond, locale),
        answer: lesson.closing === null ? "" : localized(lesson.closing.answer, locale),
        nearestUrl: lesson.production[0]?.files[0]?.url ?? "",
    }
}
