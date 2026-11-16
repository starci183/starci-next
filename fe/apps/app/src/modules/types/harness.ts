/** The two tools the harness guides and trials are written for, in the order the picker lists them. */
export const HARNESS_TOOLS = ["claude", "codex"] as const

/** One tool of the harness (`claude` is Claude Code, `codex` is Codex). */
export type HarnessTool = (typeof HARNESS_TOOLS)[number]

/** The three parts of the harness area, in the order a learner meets them. */
export const HARNESS_PARTS = ["build", "use", "docs"] as const

/** One part of the harness area. */
export type HarnessPart = (typeof HARNESS_PARTS)[number]

/** The languages the harness content ships in. */
export type HarnessLocale = "vi" | "en"

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
    readonly cases: ReadonlyArray<HarnessE2eCaseView>
    readonly steps: ReadonlyArray<HarnessStepView>
}

/** One build of part 1 with its stages. */
export type HarnessBuildView = {
    readonly id: string
    readonly title: string
    readonly summary: string
    readonly stack: ReadonlyArray<string>
    /** The CLI line that pulls the starter source. */
    readonly pullCommand: string
    /** When the newest e2e result arrived (ISO time); empty when none did. */
    readonly ranAt: string
    readonly stages: ReadonlyArray<HarnessStageView>
}

/** One build as the list of part 1 draws it. */
export type HarnessBuildRowView = {
    readonly id: string
    readonly title: string
    readonly summary: string
    readonly stack: ReadonlyArray<string>
    readonly passed: number
    readonly total: number
    readonly stagesGreen: number
    readonly stagesTotal: number
}

/** One guide of part 2 as the list draws it. */
export type HarnessGuideRowView = {
    readonly slug: string
    readonly tool: HarnessTool
    readonly title: string
    readonly summary: string
    readonly minutes: number
}

/** One guide of part 2: the row and its markdown (the page cuts it into sections at its second-level headings). */
export type HarnessGuideView = HarnessGuideRowView & { readonly markdown: string }

/** One article of part 3 as the list draws it. */
export type HarnessDocRowView = {
    readonly slug: string
    readonly title: string
    readonly summary: string
    readonly minutes: number
}

/** One article of part 3: the row and its markdown. */
export type HarnessDocView = HarnessDocRowView & { readonly markdown: string }

/** One local probe of `harness doctor`: what it checked, how it came out and what to do about a failure. */
export type HarnessProbeView = {
    readonly id: string
    readonly title: string
    readonly outcome: "pass" | "fail" | "skipped"
    readonly detail: string
    /** The guide that fixes a failing probe; empty when none does. */
    readonly guideSlug: string
}

/** The newest `harness doctor` result of one tool. */
export type HarnessDoctorView = {
    readonly tool: HarnessTool
    /** The command that produces it on the learner's machine. */
    readonly command: string
    /** When the result arrived (ISO time); empty when the learner never ran it. */
    readonly ranAt: string
    readonly probes: ReadonlyArray<HarnessProbeView>
}

/** One shortcut the agent was seen taking in a trial (editing a test, skipping a hook). */
export type HarnessShortcutView = {
    readonly id: string
    readonly label: string
    readonly count: number
}

/** The verdict of a trial: the agent finished without shortcuts, took shortcuts, or the trap was never run. */
export type HarnessVerdict = "clean" | "shortcut" | "untested"

/** One trap of the trial panel with what the headless run observed. */
export type HarnessTrialView = {
    readonly id: string
    readonly tool: HarnessTool
    readonly title: string
    readonly summary: string
    /** The command that runs the trial on the learner's machine. */
    readonly command: string
    /** The cost estimate the CLI asks to confirm; empty when never run. */
    readonly cost: string
    readonly verdict: HarnessVerdict
    readonly shortcuts: ReadonlyArray<HarnessShortcutView>
}

/** Everything the hub and the list pages read at once: the builds, the guides, the articles, the doctor and the trials. */
export type HarnessCatalogView = {
    readonly builds: ReadonlyArray<HarnessBuildRowView>
    readonly guides: ReadonlyArray<HarnessGuideRowView>
    readonly docs: ReadonlyArray<HarnessDocRowView>
    readonly doctors: ReadonlyArray<HarnessDoctorView>
    readonly trials: ReadonlyArray<HarnessTrialView>
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
