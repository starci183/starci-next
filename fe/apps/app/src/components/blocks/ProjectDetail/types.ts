import type { PracticeRow } from "@starci-next/ui"

/** One probe of the last run, already in words. */
export type ProbeLineView = { readonly id: string; readonly text: string; readonly isPassed: boolean }

/** The project as it is drawn: every word is already resolved. */
export type ProjectDetailView = {
    readonly eyebrow: string
    readonly title: string
    readonly description: string
    readonly facts: ReadonlyArray<string>
    readonly repo: string
    readonly milestones: ReadonlyArray<PracticeRow>
    readonly progress: string
    /** The note about concepts that show results from the machine only, or empty. */
    readonly practising: string
    readonly ciLine: string
    readonly ciPassed: boolean | undefined
    readonly deployedUrl: string
    readonly probeLine: string
    readonly probePassed: boolean | undefined
    readonly probes: ReadonlyArray<ProbeLineView>
}

/** The fixed words of the project page. */
export type ProjectDetailLabels = {
    readonly back: string
    readonly backHref: string
    readonly notFound: string
    readonly notFoundText: string
    readonly repo: string
    readonly milestones: string
    readonly milestoneIntro: string
    readonly syncTitle: string
    readonly syncText: string
    readonly sync: string
    readonly syncing: string
    readonly ciTitle: string
    readonly probeTitle: string
    readonly probeText: string
    readonly deployedLabel: string
    readonly saveDeployed: string
    readonly runProbes: string
    readonly runningProbes: string
    readonly secretTitle: string
    readonly secretText: string
    readonly rotate: string
    readonly rotating: string
    readonly newSecret: string
    readonly copy: string
    readonly copied: string
    readonly layoutTitle: string
    readonly layoutTree: string
    readonly layoutTests: string
    readonly layoutTestsText: string
    readonly layoutFlow: string
    readonly passed: string
    readonly failed: string
}

/** What the learner typed or was handed on the page, apart from the read. */
export type ProjectDetailFields = {
    /** The deployed address in the field. */
    readonly deployed: string
    readonly secret: string | undefined
    readonly issueWords: string
}

/** Which commands of the page are running; each flag is the pending prop of its own button. */
export type ProjectDetailBusy = {
    readonly isSaving: boolean
    readonly isProbing: boolean
    readonly isSyncing: boolean
    readonly isRotating: boolean
}
