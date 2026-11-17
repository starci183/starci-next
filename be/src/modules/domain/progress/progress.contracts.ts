/** The locales the progress read model speaks. */
export type ProgressLocale = "vi" | "en"

/** The plan a learner reads the app under. */
export type ProgressPlan = "free" | "premium"

/** The four parts of an Essentials lesson, in order. */
export type EssentialsPartId = "essence" | "source" | "script" | "apply"

/** Whether the learner's plan opens a part. */
export type PartAccess = "unlocked" | "locked"

/** How far one thing goes: nothing yet, practising (results from the learner machine), or proved. */
export type ProofState = "none" | "practising" | "proved"

/** The verdict the harness checks give: not run, failed some, or passed all. */
export type HarnessVerdict = "not-run" | "failed" | "passed"

/** What a trial of a trap ended in. */
export type TrialVerdict = "held" | "breached" | "incomplete"

/** The kinds of line the recent-activity timeline holds. */
export type ActivityKind = "lesson-done" | "concept-proved" | "experience-verified" | "harness-stage"

/** The sources of the read model; a source that fails is listed in `unavailable`. */
export type ProgressSourceId = "streak" | "review" | "practice" | "essentials" | "projects" | "harness" | "experience"

/** One opener of a lesson: five questions answered once before the lesson and again after it. */
export interface OpenerSource {
    /** The questions answered at least once. */
    readonly answered: number
    /** The questions right the first time (before). */
    readonly firstCorrect: number
    /** The questions right now (after). */
    readonly latestCorrect: number
}

/** A lesson of the catalog with what the learner did in it. */
export interface EssentialsLessonSource {
    /** The lesson id. */
    readonly id: string
    /** The lesson title in the asked locale. */
    readonly title: string
    /** The topic id. */
    readonly topicId: string
    /** The topic title in the asked locale. */
    readonly topicTitle: string
    /** When the learner finished the lesson, or null. */
    readonly completedAt: string | null
    /** Whether the learner opened the lesson at all. */
    readonly started: boolean
    /** The opener, or null while no question was answered. */
    readonly opener: OpenerSource | null
}

/** One build of the harness as its own capability reports it (contract: harnessBuilds). */
export interface HarnessBuildSource {
    /** The build id. */
    readonly id: string
    /** The build title in the asked locale. */
    readonly title: string
    /** The stages with how far each goes. */
    readonly stages: ReadonlyArray<{ readonly id: string; readonly title: string; readonly state: ProofState }>
}

/** One doctor run of a tool. */
export interface HarnessDoctorSource {
    /** `claude` or `codex`. */
    readonly tool: string
    /** The probes that passed. */
    readonly passed: number
    /** The probes of the tool. */
    readonly total: number
    /** The probes that failed. */
    readonly failed: number
}

/** The newest trial of one trap. */
export interface HarnessTrialSource {
    /** The trap id. */
    readonly trap: string
    /** The trap title in the asked locale. */
    readonly title: string
    /** The newest verdict, or null when never tried. */
    readonly last: { readonly tool: string; readonly verdict: TrialVerdict; readonly at: string } | null
}

/** One stage of a build reaching a new level, for the timeline. */
export interface HarnessEventSource {
    /** A stable id. */
    readonly id: string
    /** The stage title. */
    readonly title: string
    /** When. */
    readonly at: string
}

/** What the harness capability tells about one learner. */
export interface HarnessSource {
    /** The builds. */
    readonly builds: ReadonlyArray<HarnessBuildSource>
    /** The doctor runs. */
    readonly doctor: ReadonlyArray<HarnessDoctorSource>
    /** The trials. */
    readonly trials: ReadonlyArray<HarnessTrialSource>
    /** The newest stage events, for the timeline. */
    readonly events: ReadonlyArray<HarnessEventSource>
}

/** One project as the projects capability reports it. */
export interface ProjectSource {
    /** The project id. */
    readonly id: string
    /** The project name. */
    readonly name: string
    /** Concepts proved. */
    readonly provedConcepts: number
    /** Concepts with machine results only. */
    readonly practisingConcepts: number
    /** Concepts the milestones list. */
    readonly totalConcepts: number
    /** Milestones done. */
    readonly doneMilestones: number
    /** Milestones listed. */
    readonly totalMilestones: number
}

/** A concept proved, for the timeline. */
export interface ProvedConceptSource {
    /** The project. */
    readonly projectId: string
    /** The concept. */
    readonly conceptId: string
    /** When it was first proved. */
    readonly provedAt: string
}

/** A verified experience item, for the timeline. */
export interface VerifiedItemSource {
    /** The item id. */
    readonly itemId: string
    /** The line signed, in the asked locale. */
    readonly title: string
    /** When it was signed. */
    readonly signedAt: string
}

/** The review day. */
export interface ReviewSource {
    /** Items due today, overdue included. */
    readonly due: number
    /** The part of `due` before today. */
    readonly overdue: number
    /** Items reviewed today. */
    readonly doneToday: number
    /** The daily goal. */
    readonly goalDaily: number
}

/** One practice pattern with the learner's accepted problems. */
export interface PracticePatternSource {
    /** The pattern id. */
    readonly patternId: string
    /** The title in the asked locale. */
    readonly title: string
    /** How many problems of the pattern the learner got accepted. */
    readonly acceptedCount: number
    /** How many problems the pattern has. */
    readonly problemCount: number
}

/** The streak as the progress shows it. */
export interface StreakSource {
    /** The current run of days. */
    readonly current: number
    /** The best run. */
    readonly longest: number
    /** Whether today counts. */
    readonly todayCounted: boolean
}

/** Everything the read model is built from; a source that could not be read is null. */
export interface ProgressSources {
    /** The plan of the learner. */
    readonly plan: ProgressPlan
    /** The parts of an Essentials lesson the entitlement setting opens for this learner. */
    readonly openParts: ReadonlyArray<EssentialsPartId>
    /** The streak. */
    readonly streak: StreakSource | null
    /** The review day. */
    readonly review: ReviewSource | null
    /** The practice patterns in catalog order. */
    readonly practice: ReadonlyArray<PracticePatternSource> | null
    /** The lessons of the catalog. */
    readonly lessons: ReadonlyArray<EssentialsLessonSource> | null
    /** The harness. */
    readonly harness: HarnessSource | null
    /** The projects; read only for a subscriber. */
    readonly projects: ReadonlyArray<ProjectSource> | null
    /** The concepts proved, newest first. */
    readonly proved: ReadonlyArray<ProvedConceptSource>
    /** The verified items, newest first. */
    readonly verified: ReadonlyArray<VerifiedItemSource>
    /** The sources that failed. */
    readonly unavailable: ReadonlyArray<ProgressSourceId>
}

/** The ribbon on top of the progress page. */
export interface ProgressRibbonView {
    /** Concepts proved in Projects. */
    readonly provedConcepts: number
    /** The current streak. */
    readonly streak: number
    /** Lessons finished. */
    readonly lessonsDone: number
    /** Harness builds with every stage proved. */
    readonly buildsDone: number
}

/** One lesson of a topic with its opener. */
export interface ProgressLessonView {
    /** The lesson id. */
    readonly lessonId: string
    /** The title. */
    readonly title: string
    /** Whether the learner finished it. */
    readonly done: boolean
    /** Whether the learner opened it. */
    readonly started: boolean
    /** Questions of the opener. */
    readonly openerTotal: number
    /** Questions answered. */
    readonly openerAnswered: number
    /** Questions right before the lesson, or null while none was answered. */
    readonly before: number | null
    /** Questions right now, or null while none was answered. */
    readonly after: number | null
}

/** One topic of Essentials. */
export interface ProgressTopicView {
    /** The topic id. */
    readonly topicId: string
    /** The title. */
    readonly title: string
    /** Lessons finished. */
    readonly lessonsDone: number
    /** Lessons in the topic. */
    readonly lessonsTotal: number
    /** The lessons in the catalog order. */
    readonly lessons: Array<ProgressLessonView>
}

/** One part of an Essentials lesson and whether the plan opens it. */
export interface ProgressPartView {
    /** The part. */
    readonly part: EssentialsPartId
    /** The position, from 1. */
    readonly order: number
    /** Whether the plan opens it. */
    readonly access: PartAccess
}

/** The Essentials section. */
export interface ProgressEssentialsView {
    /** Lessons finished. */
    readonly lessonsDone: number
    /** Lessons opened. */
    readonly lessonsStarted: number
    /** Lessons in the catalog. */
    readonly lessonsTotal: number
    /** The opener questions right before, over every lesson answered. */
    readonly beforeCorrect: number
    /** The opener questions right now. */
    readonly afterCorrect: number
    /** The opener questions answered. */
    readonly answered: number
    /** The topics the learner touched first, then the rest. */
    readonly topics: Array<ProgressTopicView>
    /** The four parts and whether the plan opens each. */
    readonly parts: Array<ProgressPartView>
}

/** One stage of a build. */
export interface ProgressStageView {
    /** The stage id. */
    readonly stageId: string
    /** The title. */
    readonly title: string
    /** How far it goes. */
    readonly state: ProofState
}

/** One build. */
export interface ProgressBuildView {
    /** The build id. */
    readonly buildId: string
    /** The title. */
    readonly title: string
    /** How far it goes. */
    readonly state: ProofState
    /** Stages proved. */
    readonly stagesProved: number
    /** Stages with machine results only. */
    readonly stagesPractising: number
    /** Stages in the build. */
    readonly stagesTotal: number
    /** The stages in order. */
    readonly stages: Array<ProgressStageView>
}

/** The doctor verdict of one tool. */
export interface ProgressDoctorView {
    /** `claude` or `codex`. */
    readonly tool: string
    /** The verdict. */
    readonly verdict: HarnessVerdict
    /** Probes passed. */
    readonly passed: number
    /** Probes of the tool. */
    readonly total: number
}

/** The newest trial of one trap. */
export interface ProgressTrialView {
    /** The trap id. */
    readonly trap: string
    /** The title. */
    readonly title: string
    /** The tool of the newest run, or null. */
    readonly tool: string | null
    /** The verdict of the newest run, or null when never tried. */
    readonly verdict: TrialVerdict | null
    /** When it ran, or null. */
    readonly at: string | null
}

/** The Harness section. It is free for everyone. */
export interface ProgressHarnessView {
    /** Builds with every stage proved. */
    readonly buildsDone: number
    /** Builds. */
    readonly buildsTotal: number
    /** The builds. */
    readonly builds: Array<ProgressBuildView>
    /** The doctor verdict of each tool. */
    readonly doctor: Array<ProgressDoctorView>
    /** The newest trial of each trap. */
    readonly trials: Array<ProgressTrialView>
}

/** One project of the Projects section. */
export interface ProgressProjectView {
    /** The project id. */
    readonly projectId: string
    /** The name. */
    readonly name: string
    /** Concepts proved. */
    readonly proved: number
    /** Concepts practising. */
    readonly practising: number
    /** Concepts listed. */
    readonly total: number
    /** Milestones done. */
    readonly milestonesDone: number
    /** Milestones listed. */
    readonly milestonesTotal: number
}

/** The Projects section; subscribers only. */
export interface ProgressProjectsView {
    /** Concepts proved over every project. */
    readonly conceptsProved: number
    /** Concepts practising over every project. */
    readonly conceptsPractising: number
    /** Concepts listed. */
    readonly conceptsTotal: number
    /** Milestones done. */
    readonly milestonesDone: number
    /** Milestones listed. */
    readonly milestonesTotal: number
    /** The projects. */
    readonly projects: Array<ProgressProjectView>
}

/** The Review section. */
export interface ProgressReviewView {
    /** Items due. */
    readonly due: number
    /** The part of due before today. */
    readonly overdue: number
    /** Items done today. */
    readonly doneToday: number
    /** The daily goal. */
    readonly goalDaily: number
    /** The current streak. */
    readonly streak: number
    /** The best streak. */
    readonly longestStreak: number
    /** Whether today counts. */
    readonly todayCounted: boolean
}

/** One pattern of the Practice section. */
export interface ProgressPracticePatternView {
    /** The pattern id. */
    readonly patternId: string
    /** The title in the asked locale. */
    readonly title: string
    /** Problems accepted. */
    readonly acceptedCount: number
    /** Problems the pattern has. */
    readonly problemCount: number
}

/** The Practice section. */
export interface ProgressPracticeView {
    /** Problems accepted across every pattern. */
    readonly acceptedCount: number
    /** Problems across every pattern. */
    readonly problemCount: number
    /** Patterns with some problem accepted and some not. */
    readonly patternsInProgress: number
    /** Patterns with every problem accepted. */
    readonly patternsDone: number
    /** The patterns in catalog order. */
    readonly patterns: Array<ProgressPracticePatternView>
}

/** One line of the recent-activity timeline. */
export interface ProgressActivityView {
    /** A stable id of the line. */
    readonly id: string
    /** What happened. */
    readonly kind: ActivityKind
    /** What it was about, in the asked locale where the source has one. */
    readonly title: string
    /** When, ISO 8601 UTC. */
    readonly at: string
}

/** Everything the progress page shows. */
export interface LearnerProgressView {
    /** The plan the learner reads under. */
    readonly plan: ProgressPlan
    /** The top ribbon. */
    readonly ribbon: ProgressRibbonView
    /** Essentials; null when its source failed. */
    readonly essentials: ProgressEssentialsView | null
    /** Harness; null when its source failed. */
    readonly harness: ProgressHarnessView | null
    /** Projects; null for a learner without a subscription (the page shows the pitch) or when its source failed. */
    readonly projects: ProgressProjectsView | null
    /** Whether Projects is closed to the plan. */
    readonly projectsLocked: boolean
    /** Review and streak; null when both failed. */
    readonly review: ProgressReviewView | null
    /** Practice; null when its source failed. */
    readonly practice: ProgressPracticeView | null
    /** The newest lines first. */
    readonly activity: Array<ProgressActivityView>
    /** The sources that could not be read; their sections show unavailable. */
    readonly unavailable: Array<ProgressSourceId>
}
