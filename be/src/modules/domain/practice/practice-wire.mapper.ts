import type {
    PracticeNextView,
    PracticeProblemItemView,
    PracticeProblemView,
    PracticeResumeProblemView,
    PracticeSolutionView,
    PracticeStarterCodeView,
    PracticeSubmissionView,
} from "./practice.contracts"

/** A view whose closed-set fields travel as their upper-case wire names. */
type Wired<T, K extends keyof T> = Omit<T, K> & { readonly [P in K]: string }

/** A problem of a pattern list as the door sends it. */
export type PracticeProblemItemWire = Wired<PracticeProblemItemView, "difficulty" | "status">

/** One starter code as the door sends it. */
export type PracticeStarterCodeWire = Wired<PracticeStarterCodeView, "language">

/** A problem as the door sends it. */
export type PracticeProblemWire = Omit<Wired<PracticeProblemView, "difficulty" | "status">, "starterCodes"> & {
    /** The starter codes with their languages as wire names. */
    readonly starterCodes: ReadonlyArray<PracticeStarterCodeWire>
}

/** A submission as the door sends it: the instant is an ISO string. */
export type PracticeSubmissionWire = Omit<
    Wired<PracticeSubmissionView, "language" | "kind" | "verdict">,
    "createdAt"
> & {
    /** When the submission was made, an ISO instant. */
    readonly createdAt: string
}

/** The wire name of a closed-set value: upper case, hyphens as underscores (`wrong-answer` is `WRONG_ANSWER`). */
const wireOf = (value: string): string => value.toUpperCase().replaceAll("-", "_")

/** The problems of a pattern with their closed-set fields as wire names. */
export const toProblemItemWires = (views: ReadonlyArray<PracticeProblemItemView>): Array<PracticeProblemItemWire> =>
    views.map((view) => ({ ...view, difficulty: wireOf(view.difficulty), status: wireOf(view.status) }))

/** One problem with its closed-set fields as wire names. */
export const toProblemWire = (view: PracticeProblemView): PracticeProblemWire => ({
    ...view,
    difficulty: wireOf(view.difficulty),
    status: wireOf(view.status),
    starterCodes: view.starterCodes.map((code) => ({ ...code, language: wireOf(code.language) })),
})

/** One submission with its closed-set fields as wire names and its instant as an ISO string. */
export const toSubmissionWire = (view: PracticeSubmissionView): PracticeSubmissionWire => ({
    ...view,
    language: wireOf(view.language),
    kind: wireOf(view.kind),
    verdict: wireOf(view.verdict),
    createdAt: view.createdAt.toISOString(),
})

/** The problem to resume as the door sends it: the verdict of the latest submit as its wire name. */
export type PracticeResumeWire = Omit<PracticeResumeProblemView, "lastVerdict"> & {
    /** The verdict of the latest graded submit as a wire name. */
    readonly lastVerdict: string
}

/** The next and the resume problem as the door sends them. */
export interface PracticeNextWire {
    /** The first problem not yet accepted, or null. */
    readonly next: PracticeNextView["next"]
    /** The problem to resume, or null. */
    readonly resume: PracticeResumeWire | null
}

/** The next and the resume problem with the verdict as a wire name. */
export const toNextWire = (view: PracticeNextView): PracticeNextWire => ({
    next: view.next,
    resume: view.resume === null ? null : { ...view.resume, lastVerdict: wireOf(view.resume.lastVerdict) },
})

/** A revealed solution as the door sends it: the instant is an ISO string. */
export type PracticeSolutionWire = Omit<PracticeSolutionView, "revealedAt"> & {
    /** When the learner first revealed it, an ISO instant. */
    readonly revealedAt: string
}

/** One revealed solution with its instant as an ISO string. */
export const toSolutionWire = (view: PracticeSolutionView): PracticeSolutionWire => ({
    ...view,
    revealedAt: view.revealedAt.toISOString(),
})
