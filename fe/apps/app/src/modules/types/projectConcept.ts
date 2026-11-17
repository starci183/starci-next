import type { BadgeTone } from "@starci/grammar/common"
import type { ConceptCardView } from "@starci-next/ui"

/** What the AI teacher says about one criterion of the code read. */
export type RubricVerdict = "met" | "partial" | "missing"

/** One row of the code-read rubric: the criterion in words and its verdict. The words come from the door that owns the rubric (the evidence rules). */
export type CodeReadRubricRow = {
    readonly id: string
    readonly text: string
    readonly verdict: RubricVerdict
}

/** The CV line a concept earns once it is proved, with the evidence it stands on. */
export type CvPreviewView = {
    readonly text: string
    /** True once the concept is proved; false while the line is only what it would say. */
    readonly isProved: boolean
    readonly evidence: string
}

/** One line of the probe log of a concept: the probe, its verdict and what it saw, already in words. */
export type ConceptProbeLine = {
    readonly id: string
    readonly passed: boolean
    readonly text: string
}

/** The latest signed CI run of the project, already in words. */
export type CiRunView = {
    readonly run: string
    readonly commit: string
    readonly verdictLabel: string
    readonly verdictTone: BadgeTone
    readonly when: string
}

/** The evidence page of one concept as it is drawn. */
export type ProjectConceptView = {
    readonly concept: ConceptCardView
    readonly projectName: string
    readonly milestoneTitle: string
    readonly deployedUrl: string
    /** The log of the latest probe run, one line per result of this concept, with the opening line; empty when no probe ran. */
    readonly probeLines: ReadonlyArray<ConceptProbeLine>
    readonly ci: CiRunView | undefined
    /** Empty until the AI teacher has read the code. */
    readonly rubric: ReadonlyArray<CodeReadRubricRow>
    readonly cv: CvPreviewView | undefined
}

/** The fixed words of the concept evidence page. */
export type ProjectConceptLabels = {
    readonly crumbTrail: string
    readonly crumbRoot: string
    readonly crumbRootHref: string
    readonly projectHref: string
    readonly milestoneHref: string
    readonly notFound: string
    readonly notFoundText: string
    readonly back: string
    readonly slotsTitle: string
    readonly probeTitle: string
    readonly probeOn: string
    readonly probeEmpty: string
    readonly probeRun: string
    readonly probeRunning: string
    readonly probeNoDeploy: string
    readonly ciTitle: string
    readonly ciEmpty: string
    readonly ciRun: string
    readonly ciCommit: string
    readonly ciVerdict: string
    readonly ciWhen: string
    readonly codeTitle: string
    readonly codeEmpty: string
    readonly rubricTitle: string
    readonly rubricEmpty: string
    readonly verdict: Readonly<Record<RubricVerdict, string>>
    readonly cvTitle: string
    readonly cvEmpty: string
    readonly cvVerified: string
    readonly cvPreview: string
    readonly cvNote: string
    readonly askClaude: string
    readonly askClaudeHref: string
    readonly lesson: string
    readonly questionLabel: string
    readonly pointerTitle: string
    readonly location: string
    readonly endpoint: string
    readonly sampleBody: string
    readonly savePointer: string
    readonly savingPointer: string
    readonly explainTitle: string
    readonly explainText: string
    readonly excerpt: string
    readonly explanation: string
    readonly explain: string
    readonly explaining: string
    readonly comingSoon: string
}
