/** The two tools the harness guides and trials are written for, in the order the picker lists them. */
export const HARNESS_TOOLS = ["claude", "codex"] as const

/** One tool of the harness (`claude` is Claude Code, `codex` is Codex). */
export type HarnessTool = (typeof HARNESS_TOOLS)[number]

/** The three parts of the harness area, in the order a learner meets them. */
export const HARNESS_PARTS = ["build", "use", "docs"] as const

/** One part of the harness area. */
export type HarnessPart = (typeof HARNESS_PARTS)[number]

/** How the newest e2e run of a stage stands: all green, some red, never run, or running right now. */
export type HarnessE2eOutcome = "green" | "red" | "untested" | "running"

/** One e2e case of a stage as the learner's machine reported it over the relay. */
export type HarnessE2eCaseView = {
    readonly id: string
    readonly title: string
    readonly outcome: "green" | "red" | "untested"
    /** Why a red case failed, in the runner's words; empty for the others. */
    readonly detail: string
}

/** One step of the guide of a stage: a title and its markdown with copyable code blocks and commands. */
export type HarnessStepView = {
    readonly id: string
    readonly title: string
    readonly markdown: string
}

/** One stage of a build: its e2e result and the step guide that takes the starter source to it. */
export type HarnessStageView = {
    readonly id: string
    readonly title: string
    readonly summary: string
    readonly passed: number
    readonly total: number
    readonly outcome: HarnessE2eOutcome
    /** True while an earlier stage is not green yet. */
    readonly isLocked: boolean
    /** The stage as the back end states it: never run, practising on the learner's machine, or proved by an attested CI run. */
    readonly proof: "NONE" | "PRACTISING" | "PROVED"
    readonly cases: ReadonlyArray<HarnessE2eCaseView>
    readonly steps: ReadonlyArray<HarnessStepView>
}

/** One build of part 1 with its stages. */
export type HarnessBuildView = {
    readonly id: string
    readonly title: string
    readonly summary: string
    /** The environment names the build asks the learner to put in their own `.env` (any one of each need is enough). */
    readonly keys: ReadonlyArray<string>
    /** The CLI line that pulls the starter source. */
    readonly pullCommand: string
    /** When the newest e2e result arrived (ISO time); empty when none did. */
    readonly ranAt: string
    /** Whether a repository is bound to the build for proof. */
    readonly isBound: boolean
    readonly stages: ReadonlyArray<HarnessStageView>
}

/** One build as the list of part 1 draws it. */
export type HarnessBuildRowView = {
    readonly id: string
    readonly title: string
    readonly summary: string
    readonly keys: ReadonlyArray<string>
    readonly stageCount: number
    /** Stages with at least one relayed result. */
    readonly practisingStages: number
    /** Stages proved by an attested CI run. */
    readonly provedStages: number
}

/** One guide of part 2 as the list draws it. */
export type HarnessGuideRowView = {
    readonly slug: string
    readonly tool: HarnessTool
    readonly title: string
    readonly summary: string
}

/** One guide of part 2: the row, its sections and the probes that check it. */
export type HarnessGuideView = HarnessGuideRowView & {
    readonly sections: ReadonlyArray<HarnessSectionView>
    readonly probes: ReadonlyArray<HarnessProbeView>
}

/** One article of part 3 as the list draws it. */
export type HarnessDocRowView = {
    readonly slug: string
    readonly title: string
    readonly summary: string
}

/** One article of part 3: the row and its sections. */
export type HarnessDocView = HarnessDocRowView & { readonly sections: ReadonlyArray<HarnessSectionView> }

/** One local probe of `harness doctor`: what it checked, how it came out and what to do about a failure. */
export type HarnessProbeView = {
    readonly id: string
    readonly title: string
    readonly outcome: "pass" | "fail" | "skipped"
    /** The reason the runner gave, or the fix hint of a failing probe; empty for the others. */
    readonly detail: string
    /** The guide that fixes a failing probe; empty when none does. */
    readonly guideSlug: string
    /** When the result arrived (ISO time); empty when the probe never ran. */
    readonly at: string
}

/** The newest `harness doctor` result of one tool. */
export type HarnessDoctorView = {
    readonly tool: HarnessTool
    /** The command that produces it on the learner's machine. */
    readonly command: string
    /** When the newest result arrived (ISO time); empty when the learner never ran it. */
    readonly ranAt: string
    readonly probes: ReadonlyArray<HarnessProbeView>
}

/** One shortcut the agent was seen taking in a trial (editing a test, skipping a hook). */
export type HarnessShortcutView = {
    readonly id: string
    readonly label: string
    readonly count: number
    /** True when the tool refused the call, so nothing went through. */
    readonly isBlocked: boolean
}

/** The verdict of a trial: every rule held, a shortcut went through, other rules failed (red tests, no commit), or the trap was never run. */
export type HarnessVerdict = "clean" | "shortcut" | "incomplete" | "untested"

/** One trap of the trial panel with what the headless run observed. */
export type HarnessTrialView = {
    readonly id: string
    readonly tool: HarnessTool
    readonly title: string
    readonly summary: string
    /** The command that runs the trial on the learner's machine. */
    readonly command: string
    /** The expected output tokens of a run (turns times tokens per turn); 0 when the back end gives no estimate. */
    readonly tokens: number
    readonly verdict: HarnessVerdict
    readonly shortcuts: ReadonlyArray<HarnessShortcutView>
}

/** One section of a markdown document, cut at its second-level headings; the page draws one per anchor. */
export type HarnessSectionView = {
    readonly id: string
    readonly title: string
    readonly markdown: string
}

/** One line of the outline beside a document: where it jumps to and how it reads. */
export type HarnessOutlineEntry = {
    readonly id: string
    readonly label: string
    readonly href: string
}

/** One part of the hub as the back end counts it for the learner. */
export type HarnessHubPartView = {
    readonly key: HarnessPart
    readonly title: string
    readonly summary: string
    readonly total: number
    readonly practising: number
    readonly proved: number
    readonly done: number
}
