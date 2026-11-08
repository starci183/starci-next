import type { LessonWorkbench } from "@/hooks/lesson"
import {
    FREE_PHASES,
    LESSON_PHASES,
    type AttemptView,
    type LessonPhase,
    type LessonView,
    type ProgressView,
    type SectionView,
    type StudyCardView,
    type StudyView,
    type StudyWords,
} from "@/modules/types"
import { sectionCardsOf } from "@/hooks/lessonCards"
import { compareOf, outcomesOf } from "@/hooks/lessonProgress"
import { lessonPath, topicPath } from "@/modules/routes"

/** What a phase needs from the lesson to draw its cards: the lesson and the learner's work in it. */
type StudyInput = {
    readonly lesson: LessonView
    readonly phase: LessonPhase
    readonly workbench: LessonWorkbench
    /** The learner progress in the lesson, once the server answered it. */
    readonly progress: ProgressView | undefined
    /** The attempt at the opening diagnostic, to set beside the reflection. */
    readonly challenge: AttemptView | undefined
    /** The words the block resolved for the lesson facts and the score line. */
    readonly words: StudyWords
}

/** True when a reader without Premium may not open the phase. */
const isPhaseLocked = (lesson: LessonView, phase: LessonPhase): boolean =>
    !lesson.isPremium && !FREE_PHASES.includes(phase)

/** The sections of a phase in reading order. */
export const phaseSectionsOf = (lesson: LessonView, phase: LessonPhase): ReadonlyArray<SectionView> =>
    lesson.sections.filter((section) => section.phase === phase)

/** The section of a phase on screen: the one the reader opened, or the first. */
export const openSectionOf = (
    sections: ReadonlyArray<SectionView>,
    phase: LessonPhase,
    workbench: LessonWorkbench,
): SectionView | undefined => sections.find((section) => section.id === workbench.tabs[phase]) ?? sections[0]

/** The cards of the phase on screen; a locked phase draws none, and the lab files lead the apply phase. */
const cardsOf = (input: StudyInput): ReadonlyArray<StudyCardView> => {
    if (isPhaseLocked(input.lesson, input.phase)) return []
    const sections = phaseSectionsOf(input.lesson, input.phase)
    const open = openSectionOf(sections, input.phase, input.workbench)
    if (open === undefined) return []
    const workspace: ReadonlyArray<StudyCardView> =
        input.phase === "apply" && open.id === sections[0]?.id && input.lesson.files.length > 0
            ? [{ kind: "files", id: "workspace", files: input.lesson.files }]
            : []
    return [...sectionCardsOf(open, input.workbench, input.words), ...workspace]
}

/** The rail: every phase, linked, with the current one marked and the locked ones flagged. */
const railOf = (lesson: LessonView, phase: LessonPhase): StudyView["rail"] =>
    LESSON_PHASES.map((each) => ({
        phase: each,
        href: lessonPath(lesson.topic.id, lesson.id, each),
        isCurrent: each === phase,
        isLocked: isPhaseLocked(lesson, each),
    }))

/** The tabs of a phase with several sections, one per section; empty for a locked phase or a phase of one section. */
const tabsOf = (input: StudyInput): StudyView["tabs"] => {
    const sections = phaseSectionsOf(input.lesson, input.phase)
    if (isPhaseLocked(input.lesson, input.phase) || sections.length < 2) return []
    return sections.map((section) => ({ id: section.id, label: section.title }))
}

/** The study screen of a lesson on one phase, from the lesson and the learner's work. */
export const studyOf = (input: StudyInput): StudyView => ({
    id: input.lesson.id,
    title: input.lesson.title,
    description: input.lesson.description,
    category: input.words.category,
    topic: { ...input.lesson.topic, href: topicPath(input.lesson.topic.id) },
    difficulty: input.lesson.difficulty,
    difficultyLabel: input.words.difficulty,
    facts: input.words.facts,
    isPremium: input.lesson.isPremium,
    phase: input.phase,
    isLocked: isPhaseLocked(input.lesson, input.phase),
    rail: railOf(input.lesson, input.phase),
    overview: {
        outcomes: input.lesson.outcomes,
        prerequisites: input.lesson.prerequisites,
        scope: input.lesson.overview,
        references: input.lesson.references,
    },
    outcomes: outcomesOf(input.lesson, input.progress),
    compare: compareOf(input.lesson, input.phase, input.workbench.attempts, input.challenge),
    tabs: tabsOf(input),
    openTabId: openSectionOf(phaseSectionsOf(input.lesson, input.phase), input.phase, input.workbench)?.id ?? "",
    cards: cardsOf(input),
})
