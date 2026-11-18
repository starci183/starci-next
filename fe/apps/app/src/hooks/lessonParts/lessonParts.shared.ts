import type { QuestionLink } from "@starci-next/ui"
import { topicPath } from "@/modules/routes"
import {
    LESSON_PART_COUNT,
    type EssentialPart,
    type EssentialQuestionView,
    type LessonPartsView,
    type LessonState,
    type LessonView,
} from "@/modules/types"

/** The parts of a lesson nobody has touched. */
export const UNTOUCHED_PARTS: LessonPartsView = {
    parts: [],
    doneParts: 0,
    currentPart: 1,
    isUnderWay: false,
    isStarted: false,
    openerRight: undefined,
    openerAnswered: 0,
}

/**
 * Where the learner stands on a lesson. A reader without Premium can reach part 1 only, so for them the lesson is done when part 1
 * is; with Premium it is done when all four parts are.
 */
export const lessonStateOf = (parts: LessonPartsView, isPremium: boolean): LessonState => {
    const needed = isPremium ? LESSON_PART_COUNT : 1
    if (parts.doneParts >= needed) return "done"
    return parts.isStarted ? "doing" : "todo"
}

/** The address of a part of a lesson, with an optional anchor or scenario. */
export const partPath = (lesson: LessonView, part: EssentialPart, extra = ""): string =>
    `${topicPath(lesson.topic.id)}/${encodeURIComponent(lesson.id)}?part=${part}${extra}`

/** What the learner holds in this visit: the pick of each question, the retake marks and the selections. */
export type EssentialDesk = {
    readonly picks: Readonly<Record<string, string>>
    /** The revision of each question when the retake started; an attempt at or under it counts as not answered again. */
    readonly retakeFrom: Readonly<Record<string, number>>
    readonly openerIndex: number | undefined
    /** The screen of essence the learner chose; undefined lets the answers decide (the questions, then the article). */
    readonly stage: "questions" | "result" | "article" | undefined
}

/** The sections the article draws: the theory ones, or every section of a lesson without theory. */
export const articleSectionsOf = (lesson: LessonView): LessonView["sections"] => {
    const theory = lesson.sections.filter((section) => section.phase === "explain")
    return theory.length > 0 ? theory : lesson.sections
}

/** The two phrases a link out of a wrong answer is worded with. */
export type LinkWords = {
    readonly readSection: (n: string, title: string) => string
    readonly seeScenario: (title: string) => string
}

/** Where a wrong answer sends the learner: the section to read closely and the scenario that shows it. */
export const linksOf = (lesson: LessonView, question: EssentialQuestionView, words: LinkWords): Array<QuestionLink> => {
    const sections = articleSectionsOf(lesson)
    const index = sections.findIndex((section) => section.id === question.sectionId)
    const section = sections[index]
    const scenario = lesson.essential?.scenarios.find((each) => each.id === question.scenarioId)
    return [
        ...(section === undefined
            ? []
            : [
                  {
                      id: `section-${section.id}`,
                      label: words.readSection(
                          question.sectionRef === "" ? String(index + 1) : question.sectionRef,
                          section.title,
                      ),
                      href: partPath(lesson, "essence", `#section-${section.id}`),
                  },
              ]),
        ...(scenario === undefined
            ? []
            : [
                  {
                      id: `scenario-${scenario.id}`,
                      label: words.seeScenario(scenario.title),
                      href: partPath(lesson, "scenarios", `&scenario=${encodeURIComponent(scenario.id)}`),
                  },
              ]),
    ]
}
