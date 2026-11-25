import type { CourseIntroView, CoursePatternView, CourseProductionView } from "@starci-next/ui"
import { diagramOf, fileNameOf } from "./diagram"
import { isGreenNow, loopOf, termOf, type CourseCase, type CourseLessonRecord } from "./lesson"
import { localized, type LocalizedText } from "./views"
import type { CourseIntroWords, CoursePatternWords, CourseProductionWords } from "./words"

/** The text of a service or dependency role in the learner's language. */
const roleOf = (role: LocalizedText, locale: string): string => localized(role, locale)

/** A text the record may leave out, in the learner's language; empty when it is left out. */
const optionalOf = (text: LocalizedText | null | undefined, locale: string): string =>
    text === null || text === undefined ? "" : localized(text, locale)

/** The paragraphs of a text: blank lines divide them. */
const paragraphsOf = (text: string): ReadonlyArray<string> =>
    text
        .split(/\n\s*\n/u)
        .map((each) => each.trim())
        .filter((each) => each !== "")

/**
 * The intro page: the interview scene the record opens with, what the learner will be able to do (one ticked line per unhappy case, then
 * the interview answered), the architecture drawn from the record with the technology of each node and the services in words.
 */
export const introViewOf = (lesson: CourseLessonRecord, words: CourseIntroWords, locale: string): CourseIntroView => {
    const { stack, hook } = lesson
    const diagram = diagramOf(lesson, {
        entry: words.entry,
        frame: words.frame,
        mark: fileNameOf(lesson.learnerFile),
    })
    return {
        hook:
            hook === null
                ? undefined
                : {
                      when: localized(hook.when, locale),
                      setup: localized(hook.setup, locale),
                      question: localized(hook.question, locale),
                      stumble: localized(hook.stumble, locale),
                      promise: localized(hook.promise, locale),
                  },
        outcomes: [
            ...lesson.unhappy.map((each) => {
                const title = localized(each.title, locale)
                // A record that words no outcome for a case still gets a line: the case's own title, with nothing under it.
                return each.can === null
                    ? { id: each.id, can: title, caseTitle: "" }
                    : { id: each.id, can: localized(each.can, locale), caseTitle: words.outcomeCase(title) }
            }),
            ...(hook === null ? [] : [{ id: "answer", can: words.outcomeAnswer, caseTitle: words.outcomeAnswerCase }]),
        ],
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
    const term = termOf(lesson, lesson.concept)
    const steps = loopOf(cases, "unhappy")
    return {
        term,
        named: words.named(steps.length, term),
        retell: lesson.closing === null ? [] : paragraphsOf(localized(lesson.closing.retell, locale)),
        define: lesson.closing === null ? "" : localized(lesson.closing.define, locale),
        steps: steps.map((each) => ({
            id: each.id,
            question:
                each.spec.question === null
                    ? localized(each.spec.title, locale)
                    : localized(each.spec.question, locale),
            did: optionalOf(each.spec.did, locale),
            gain: optionalOf(each.spec.gain, locale),
            // The English name serves a Vietnamese reader to search the docs with; an English reader already reads English.
            englishName: locale === "en" ? "" : (each.spec.englishName ?? ""),
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
        label: each.short === null ? localized(each.title, locale) : localized(each.short, locale),
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
                    return {
                        id: each.id,
                        text: known ? words.shows[value] : words.shows.no,
                        isMuted: !known,
                    }
                }),
            })),
        ],
        repos: lesson.production.map((repo) => ({
            id: repo.repo,
            name: repo.repo,
            lang: repo.lang,
            note: localized(repo.note, locale),
            files: repo.files.map((file) => ({ path: file.path, url: file.url })),
        })),
        beyond: lesson.closing === null ? "" : localized(lesson.closing.beyond, locale),
        answer: lesson.closing === null ? "" : localized(lesson.closing.answer, locale),
        nearestUrl: lesson.production[0]?.files[0]?.url ?? "",
    }
}
