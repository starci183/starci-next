/** The phases of a lesson in the order a learner meets them; the overview and the review are not sections of the lesson. */
export const LESSON_PHASES = [
    "overview",
    "challenge",
    "predict",
    "explore",
    "explain",
    "apply",
    "reflect",
    "review",
] as const

/** One phase of the navigator. */
export type LessonPhase = (typeof LESSON_PHASES)[number]

/** The phases a learner without Premium may open. */
export const FREE_PHASES: ReadonlyArray<LessonPhase> = ["overview", "challenge"]

/** How hard a lesson is. */
export type LessonDifficulty = "foundation" | "intermediate" | "advanced"

/** A file an exercise or a lab hands the learner. */
export type ExerciseFileView = { readonly path: string; readonly language: string; readonly content: string }

/** The lab of one language: its id, the name shown on the switch and its files. */
export type WorkspaceVariantView = {
    readonly id: string
    readonly label: string
    readonly files: ReadonlyArray<ExerciseFileView>
    /** Where the zip of this lab is served; absent for a language the back end does not serve. */
    readonly downloadHref?: string
}
