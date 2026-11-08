/** The locales the path texts speak. */
export type PathLocale = "vi" | "en"

/** A line in both locales. */
export interface PathText {
    /** The Vietnamese text. */
    readonly vi: string
    /** The English text. */
    readonly en: string
}

/** The five outcome paths; the ids are stable, a new path is a new id (data.learning-program.outcome-path). */
export const PATH_IDS = ["founder", "ai-engineer", "backend-fullstack", "devops-sre", "system-design-senior"] as const

/** The id of an outcome path. */
export type PathId = (typeof PATH_IDS)[number]

/** The kinds of path, which colour the eyebrow of its card: build a product, build an agent, get a job. */
export type PathKind = "build" | "agent" | "job"

/** The stages every path strings its steps into, in order. */
export const PATH_STAGES = ["understand", "remember", "solve", "build", "build-ai", "interview", "prove"] as const

/** The id of a stage. */
export type PathStageId = (typeof PATH_STAGES)[number]

/** The parts of the app a step sends the learner to. */
export const PATH_PARTS = ["essentials", "review", "practice", "projects", "interview", "profile"] as const

/** The id of a part. */
export type PathPart = (typeof PATH_PARTS)[number]

/** One step of a path as the catalog defines it. */
export interface PathStepDefinition {
    /** The step id, stable inside its path. */
    readonly id: string
    /** The stage it belongs to. */
    readonly stage: PathStageId
    /** The part it sends the learner to. */
    readonly part: PathPart
    /** What the learner does. */
    readonly title: PathText
}

/** One check of the done outcome of a path. */
export interface PathCheckDefinition {
    /** The check, in both locales. */
    readonly text: PathText
    /** True for an outcome only the learner can report (an offer, first revenue); the others need a verified experience item. */
    readonly selfReported: boolean
}

/** One outcome path as the catalog defines it. */
export interface PathDefinition {
    /** The path id. */
    readonly id: PathId
    /** The kind of path. */
    readonly kind: PathKind
    /** The name of the path. */
    readonly title: PathText
    /** The promise to the learner. */
    readonly pitch: PathText
    /** The done outcome in one statement. */
    readonly done: PathText
    /** The checks of the done outcome. */
    readonly checks: ReadonlyArray<PathCheckDefinition>
    /** Rough weeks from start to done. */
    readonly weeks: number
    /** The steps in order. */
    readonly steps: ReadonlyArray<PathStepDefinition>
}

/** One step as a screen reads it. */
export interface PathStepView {
    /** The step id. */
    readonly stepId: string
    /** The part it sends to. */
    readonly part: PathPart
    /** The step in the asked locale. */
    readonly title: string
    /** Where the step is done. */
    readonly link: string
}

/** One stage as a screen reads it. */
export interface PathStageView {
    /** The stage id. */
    readonly stageId: PathStageId
    /** The stage name in the asked locale. */
    readonly title: string
    /** The steps of the stage. */
    readonly steps: ReadonlyArray<PathStepView>
}

/** A check as a screen reads it. */
export interface PathCheckView {
    /** The check in the asked locale. */
    readonly text: string
    /** Whether only the learner can report it. */
    readonly selfReported: boolean
}

/** A part chip of a path card. */
export interface PathPartView {
    /** The part id. */
    readonly part: PathPart
    /** The part name in the asked locale. */
    readonly label: string
}

/** One outcome path as a screen reads it. */
export interface PathView {
    /** The path id. */
    readonly pathId: PathId
    /** The kind of path. */
    readonly kind: PathKind
    /** The name in the asked locale. */
    readonly title: string
    /** The promise in the asked locale. */
    readonly pitch: string
    /** The done outcome in the asked locale. */
    readonly done: string
    /** The checks of the done outcome. */
    readonly checks: ReadonlyArray<PathCheckView>
    /** Rough weeks from start to done. */
    readonly weeks: number
    /** How many steps the path has. */
    readonly stepCount: number
    /** The distinct parts the steps use, in the order they first appear. */
    readonly parts: ReadonlyArray<PathPartView>
    /** The stages with their steps, empty stages left out. */
    readonly stages: ReadonlyArray<PathStageView>
}

/** The catalog and the choice of one learner. */
export interface PathCatalogView {
    /** The path the learner follows, or null. */
    readonly activePathId: string | null
    /** The five paths. */
    readonly paths: ReadonlyArray<PathView>
}

/** What choosing a path stored. */
export interface PathChosen {
    /** The path now followed. */
    readonly activePathId: string
    /** When the learner chose it (ISO instant); choosing the same path again keeps the first time. */
    readonly chosenAt: string
}

/** The path the learner follows, with the next steps. */
export interface PathActive {
    /** The path id. */
    readonly pathId: PathId
    /** The path name in the asked locale. */
    readonly title: string
    /** The next steps, at most three. */
    readonly next: ReadonlyArray<string>
}

/** The path the learner follows now, for the hub; null when none is chosen. */
export type PathActiveResult = PathActive | null
