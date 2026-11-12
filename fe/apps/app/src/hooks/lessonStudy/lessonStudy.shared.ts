import { variantsOfFiles, workspaceDownloadOf, workspaceLanguageLabelOf } from "@/modules/lesson-view"
import type { LessonWorkbench } from "@/hooks/lesson"
import {
    FREE_PHASES,
    LESSON_PHASES,
    type LessonPhase,
    type LessonView,
    type ProgressView,
    type SectionView,
    type StudyCardView,
    type StudyView,
    type StudyWords,
} from "@/modules/types"
import { sectionCardsOf, timeOf } from "@/hooks/lessonCards"
import { withDownloads } from "@/hooks/lessonFiles"
import { compareOf, outcomesOf } from "@/hooks/lessonProgress"
import { lessonPath, topicPath } from "@/modules/routes"
import { navOf, phaseResultsOf, reviewsOf, sectionChecksOf, stepperOf } from "@/hooks/lessonJourney"

/** What a phase needs from the lesson to draw its cards: the lesson and the learner's work in it. */
type StudyInput = {
    readonly lesson: LessonView
    readonly phase: LessonPhase
    readonly workbench: LessonWorkbench
    /** The learner progress in the lesson, once the server answered it. */
    readonly progress: ProgressView | undefined
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

/** The download of a lab that ships in one language only: the door of the lesson's language, when the back end serves it. */
const singleLabOf = (lesson: LessonView): { readonly downloadHref?: string; readonly downloadLanguage?: string } => {
    const language = lesson.implementation.toLowerCase()
    const downloadHref = workspaceDownloadOf(lesson.id, language)
    return downloadHref === undefined ? {} : { downloadHref, downloadLanguage: workspaceLanguageLabelOf(language) }
}

/** The cards of the phase on screen; a locked phase draws none, and the lab files lead the apply phase. */
const cardsOf = (input: StudyInput): ReadonlyArray<StudyCardView> => {
    if (isPhaseLocked(input.lesson, input.phase)) return []
    const sections = phaseSectionsOf(input.lesson, input.phase)
    const open = openSectionOf(sections, input.phase, input.workbench)
    if (open === undefined) return []
    const hasLab = input.phase === "apply" && open.id === sections[0]?.id && input.lesson.files.length > 0
    const workspace: ReadonlyArray<StudyCardView> = hasLab
        ? [
              {
                  kind: "files",
                  id: "workspace",
                  files: input.lesson.files,
                  ...(input.lesson.workspaces.length === 0
                      ? singleLabOf(input.lesson)
                      : { variants: withDownloads(input.lesson.workspaces, input.lesson.id) }),
              },
          ]
        : []
    const own = sectionCardsOf(open, input.workbench, { words: input.words, lessonId: input.lesson.id, hasLab })
    return own.some((card) => card.kind === "files") ? own : [...workspace, ...own]
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

/** The art served for a phase; the theory phase's piece is named after its step. */
const imageOf = (phase: LessonPhase): string => {
    if (phase === "overview" || phase === "review") return ""
    return `/art/steps/${phase === "explain" ? "understand" : phase}.webp`
}

/**
 * The study screen of a lesson on one phase, from the lesson and the learner's work.
 * `headline` is the title of the open section (the question the phase asks).
 */
export const studyOf = (input: StudyInput): StudyView => {
    const { lesson, phase, workbench } = input
    const sections = phaseSectionsOf(lesson, phase)
    const open = openSectionOf(sections, phase, workbench)
    const compare = compareOf(lesson, phase, workbench.attempts)
    const nav = navOf(lesson, phase, sections, open?.id ?? "")
    const completedAt = input.progress?.completedAt ?? ""
    return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        category: input.words.category,
        topic: { ...lesson.topic, href: topicPath(lesson.topic.id) },
        difficulty: lesson.difficulty,
        difficultyLabel: input.words.difficulty,
        facts: input.words.facts,
        isPremium: lesson.isPremium,
        phase,
        isLocked: isPhaseLocked(lesson, phase),
        rail: railOf(lesson, phase),
        overview: {
            outcomes: lesson.outcomes,
            prerequisites: lesson.prerequisites,
            scope: lesson.overviewMarkdown,
            references: lesson.references,
        },
        outcomes: outcomesOf(lesson, input.progress),
        compare: compare.rows,
        compareScore: compare.score,
        imageSrc: imageOf(phase),
        headline: open?.title ?? "",
        stepper: stepperOf(lesson, phase, input.progress, (each) => isPhaseLocked(lesson, each)),
        sectionIndex: open === undefined || sections.length < 2 ? 0 : sections.indexOf(open) + 1,
        sectionCount: sections.length < 2 ? 0 : sections.length,
        previous: nav.previous,
        next: nav.next,
        phaseResults: phaseResultsOf(lesson, workbench.attempts),
        sectionChecks: phase === "explain" ? sectionChecksOf(sections, workbench.attempts) : [],
        completedAt,
        completedTime: timeOf(completedAt),
        reviews: reviewsOf(input.progress),
        tabs: tabsOf(input),
        openTabId: open?.id ?? "",
        cards: cardsOf(input),
    }
}

/** How many languages the lab of a lesson ships: the workspaces, or the language folders of its exercise files. */
export const languageCountOf = (lesson: LessonView): number =>
    Math.max(
        lesson.workspaces.length,
        ...lesson.sections.flatMap((section) =>
            section.activities.map((activity) => variantsOfFiles(activity.files).length),
        ),
    )
