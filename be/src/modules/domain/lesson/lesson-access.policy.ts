import { LESSON_FREE_PHASE, type LessonLocaleDocument, type LessonPhase, type LessonSection } from "./lesson.contracts"

/**
 * The teacher's mark that covers a section: the section's own `isPremium`, else the lesson's, else none. `false` means free and
 * `true` means Premium, whatever the phase.
 */
export const premiumMarkOf = (
    section: Pick<LessonSection, "isPremium"> | null,
    document: Pick<LessonLocaleDocument, "isPremium">,
): boolean | undefined => section?.isPremium ?? document.isPremium

/**
 * Whether studying a phase needs Premium. The teacher's mark decides when the content carries one; without a mark only the free
 * phase (the challenge) is free.
 */
export const needsPremium = (phase: LessonPhase | "retrieval", mark: boolean | undefined): boolean =>
    mark ?? phase !== LESSON_FREE_PHASE
