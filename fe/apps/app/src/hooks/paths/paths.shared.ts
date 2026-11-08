import type {
    OutcomePathCardLabels,
    OutcomePathDetailView,
    OutcomePathDialogLabels,
    OutcomePathView,
} from "@starci-next/ui"
import type { OutcomePaths } from "@/hooks/swr"
import { ApiFailure } from "@/modules/failure"

/** The words the outcome paths are built with, resolved by the block from the `app.paths` catalog. */
export type PathWords = {
    /** The small line over a path title, by the kind of path the back end names. */
    readonly kind: Readonly<Record<string, string>>
    /** Steps and rough time in one line. */
    readonly meta: (steps: number, weeks: number) => string
}

/** The goal screen as it is drawn, every word resolved. */
export type PathsScreen = {
    readonly cards: ReadonlyArray<OutcomePathView>
    readonly details: ReadonlyArray<OutcomePathDetailView>
}

/** The fixed words of the goal screen, resolved from the `app.paths` catalog. */
export type PathsLabelSet = {
    readonly intro: { readonly eyebrow: string; readonly title: string; readonly description: string }
    /** The stage names in the order the paths string them. */
    readonly stages: ReadonlyArray<string>
    readonly note: string
    readonly empty: string
    readonly card: OutcomePathCardLabels
    readonly dialog: OutcomePathDialogLabels
    readonly switchConfirm: {
        readonly title: string
        readonly body: string
        readonly confirm: string
        readonly cancel: string
    }
    readonly signedOut: { readonly title: string; readonly body: string; readonly action: string }
}

/** The paths with their cards and their full views; the back end already worded them in the asked locale. */
export const pathsScreenOf = (data: OutcomePaths, words: PathWords): PathsScreen => ({
    cards: data.paths.map((path) => ({
        id: path.pathId,
        kind: words.kind[path.kind] ?? path.kind,
        title: path.title,
        pitch: path.pitch,
        done: path.done,
        parts: path.parts.map((part) => part.label),
        meta: words.meta(path.stepCount, path.weeks),
        isCurrent: path.pathId === data.activePathId,
    })),
    details: data.paths.map((path) => {
        const labels = new Map(path.parts.map((part) => [part.part, part.label]))
        return {
            id: path.pathId,
            title: path.title,
            done: path.done,
            checks: path.checks.map((check) => ({ text: check.text, isSelfReported: check.selfReported })),
            stages: path.stages.map((stage) => ({
                id: stage.stageId,
                title: stage.title,
                steps: stage.steps.map((step) => ({
                    id: step.stepId,
                    title: step.title,
                    part: labels.get(step.part) ?? step.part,
                    href: step.link,
                })),
            })),
            isCurrent: path.pathId === data.activePathId,
        }
    }),
})

/** The stable code the choose door answers for a path outside the catalog. */
const PATH_NOT_FOUND_CODE = "PATH_NOT_FOUND"

/** True when the failure says the catalog has no such path. */
export const isPathNotFound = (error: unknown): boolean =>
    error instanceof ApiFailure && error.code === PATH_NOT_FOUND_CODE
