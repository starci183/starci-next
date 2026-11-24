import type { CourseIntroView, CoursePatternView } from "@starci-next/ui"
import { diagramOf, fileNameOf, learnerServiceOf } from "./diagram"
import { isGreenNow, loopOf, termOf, type CourseCase, type CourseLessonRecord } from "./lesson"
import { localized, type LocalizedText } from "./views"
import type { CourseIntroWords, CoursePatternWords } from "./words"

/** The comma-joined names a service uses, or empty. */
const usesOf = (uses: ReadonlyArray<string>): string => uses.join(", ")

/** The text of a service or dependency role in the learner's language. */
const roleOf = (role: LocalizedText, locale: string): string => localized(role, locale)

/** The intro page: the architecture drawn from the record, its parts in words, what the learner will do and how many cases there are. */
export const introViewOf = (lesson: CourseLessonRecord, words: CourseIntroWords, locale: string): CourseIntroView => {
    const { stack } = lesson
    const file = fileNameOf(lesson.learnerFile)
    const diagram = diagramOf(lesson, { entry: words.entry, mark: file })
    const caller = learnerServiceOf(lesson)
    return {
        diagram: diagram.source,
        tones: diagram.tones,
        legend: caller === undefined ? [] : [{ tone: "accent", label: words.legendLearner(lesson.learnerFile) }],
        summary: words.summary({
            services: stack.services.length,
            happy: lesson.happy.length,
            unhappy: lesson.unhappy.length,
        }),
        services: stack.services.map((service) => ({
            id: service.id,
            title: `${service.id} :${service.port}`,
            description: words.service({
                role: roleOf(service.role, locale),
                port: service.port,
                db: service.db ?? "",
                uses: usesOf(service.uses),
            }),
        })),
        infra: stack.deps.map((dep) => ({
            id: dep.id,
            title: dep.id,
            description: words.dep({ role: roleOf(dep.role, locale), image: dep.image }),
        })),
        outcomes: [
            words.outcomeFile(lesson.learnerFile),
            ...lesson.unhappy.map((each) => words.outcomeCase(localized(each.title, locale))),
        ],
        requires: lesson.requires.map((id) => termOf(lesson, id)),
        figures: [
            { id: "happy", term: words.happyTerm, value: lesson.happy.length },
            { id: "unhappy", term: words.unhappyTerm, value: lesson.unhappy.length },
            { id: "services", term: words.servicesTerm, value: stack.services.length },
        ],
    }
}

/** The term a case teaches, or empty when the record names none. */
const teachesOf = (lesson: CourseLessonRecord, teaches: string | null): string =>
    teaches === null ? "" : termOf(lesson, teaches)

/** The page that names the pattern: the concept's term, the architecture with the concept on its node, the steps and the map to the framework version. */
export const patternViewOf = (
    lesson: CourseLessonRecord,
    cases: ReadonlyArray<CourseCase>,
    words: CoursePatternWords,
    locale: string,
): CoursePatternView => {
    const term = termOf(lesson, lesson.concept)
    const diagram = diagramOf(lesson, { entry: words.entry, mark: term })
    return {
        term,
        diagram: diagram.source,
        tones: diagram.tones,
        steps: loopOf(cases, "unhappy").map((each) => ({
            id: each.id,
            title: localized(each.spec.title, locale),
            teaches: teachesOf(lesson, each.spec.teaches),
            // The newest run, not the green of once: a step the learner broke again must not read as done.
            isGreen: isGreenNow(each),
            stateLabel: isGreenNow(each) ? words.greenLabel : words.openLabel,
        })),
        map: lesson.nestjs.map((entry, index) => ({ id: `map-${index}`, from: entry.from, to: entry.to })),
    }
}
