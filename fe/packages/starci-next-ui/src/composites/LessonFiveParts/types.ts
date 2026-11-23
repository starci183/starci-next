import type { MarkdownLabels } from "@starci/grammar/common"

/** One block of the Bản chất reading: a heading and what follows it, its own anchor so the contents can link to it. */
export type ReadingChunkView = {
    readonly id: string
    /** The heading line, as the contents and the landmark name it. */
    readonly title: string
    readonly markdown: string
}

/** One row of the contents of the reading. */
export type ReadingTocRow = {
    readonly id: string
    readonly title: string
    readonly href: string
    /** True when a missed opener question points here ("Nên đọc kỹ"). */
    readonly isFlagged: boolean
}

/** The learner's newest relayed run of one scenario, as the Bản chất flows show it beside their recorded output. */
export type ReadingRunView = {
    readonly scenarioId: string
    readonly state: "running" | "passed" | "failed"
    /** The state in words ("Xanh", "Đỏ", "Đang chạy"). */
    readonly stateLabel: string
    /** When it ran and with which guards ("07:41 · tắt versioned-set"). */
    readonly caption: string
    /** The guards the run turned off, by name. */
    readonly guardsOff: ReadonlyArray<string>
    /** The `[ledger]` lines the run printed; empty when it printed none. */
    readonly ledger: string
}

/** The Bản chất part as drawn: the reading in blocks, its contents, the lab panel, the learner's runs and the MCP config of the lesson. */
export type ReadingView = {
    readonly chunks: ReadonlyArray<ReadingChunkView>
    readonly toc: ReadonlyArray<ReadingTocRow>
    /** True while the part's section is locked to its title. */
    readonly isLocked: boolean
    /** The `:::lab` block of the reading (how to pull, start and clean up the lab); empty when the reading has none. */
    readonly lab: string
    /** The learner's newest run of each scenario the relay brought back. */
    readonly runs: ReadonlyArray<ReadingRunView>
    /** The client config of the lesson's MCP (`starci-<lesson id>`). */
    readonly mcpConfig: string
    /** The Claude Code command of the same MCP. */
    readonly mcpCommand: string
}

/** Every word of the Bản chất part. */
export type ReadingLabels = {
    /** The head of the folded long read, and of the numbered overview above it. */
    readonly deepTitle: string
    readonly overviewTitle: string
    readonly tocTitle: string
    readonly tocEmpty: string
    readonly flagged: string
    readonly locked: string
    readonly mcpTitle: string
    readonly mcpNote: string
    readonly mcpConfig: string
    readonly mcpCommand: string
    readonly mcpToken: string
    readonly copy: string
    readonly markdown: MarkdownLabels
    /** The head of the lab panel on a wide screen ("Chạy lab"). */
    readonly labTitle: string
    /** The head of the same panel on a phone ("Chạy trên máy tính sau"). */
    readonly labLater: string
    /** The head of the learner's run under a flow ("Lần chạy của bạn"). */
    readonly runYours: string
    /** The line before the learner's first run of a flow's scenario. */
    readonly runNone: string
    /** The line when the learner's newest run turned off other guards than the flow. */
    readonly runOtherGuards: string
    /** Names the ledger block of the learner's run. */
    readonly runLedger: string
}

/** Where one Tìm sạn test stands on the page. */
export type BugRowState = "none" | "running" | "passed" | "failed" | "locked"

/** One Tìm sạn test as drawn: what it checks, the newest run and what that run earned. */
export type BugRowView = {
    readonly id: string
    readonly title: string
    /** The line under the title: the opener essence it belongs to, or what the test is. */
    readonly caption: string
    readonly state: BugRowState
    readonly stateLabel: string
    /** What a red run should have measured; empty when the test has no number to compare. */
    readonly expected: string
    /** What the newest red run measured; empty unless red. */
    readonly received: string
    /** The unit of both numbers ("điểm"); empty when none. */
    readonly measure: string
    /** "Vì sao giờ đúng"; empty unless green. */
    readonly pass: string
    /** "Vì sao chưa pass"; empty unless red. */
    readonly fail: string
    /** The hints opened so far, each with its label ("Gợi ý 1"). */
    readonly hints: ReadonlyArray<{ readonly id: string; readonly label: string; readonly text: string }>
    /** The label of the button that opens the next hint; empty when none can be opened. */
    readonly nextHint: string
    readonly isOpeningHint: boolean
}

/** The Tìm sạn part as drawn. */
export type BugHuntView = {
    /** The commands that pull, start and run the bug pack, one per line. */
    readonly commands: string
    /** The title of the run list ("Lần chạy 14:32 · 2/7 pass"), or the line before the first run. */
    readonly runTitle: string
    readonly rows: ReadonlyArray<BugRowView>
    /** The essences of the bug tests in order, for the right column. */
    readonly bugs: ReadonlyArray<{ readonly id: string; readonly title: string; readonly state: BugRowState }>
    /** The online machine; empty when none is online. */
    readonly machine: string
    /** True until every test passed: Challenges stays locked. */
    readonly isChallengesLocked: boolean
    readonly passed: number
    readonly total: number
}

/** Every word of the Tìm sạn part. */
export type BugHuntLabels = {
    readonly pullTitle: string
    readonly pullNote: string
    readonly copy: string
    readonly runsEmpty: string
    readonly passTitle: string
    /** The head of the test list ("7 test"). */
    readonly testsTitle: (total: number) => string
    readonly expected: string
    readonly received: string
    readonly machineNone: string
    readonly machineNoneNote: string
    readonly machineOnline: (name: string) => string
}

/** One stack tab of Pattern. */
export type PatternStackView = {
    readonly id: string
    readonly label: string
    readonly isReady: boolean
}

/** The Pattern part as drawn: the stack tabs and the stack on screen. */
export type PatternPartView = {
    readonly stacks: ReadonlyArray<PatternStackView>
    readonly selected: string
    /** The three questions with their answers, for a ready stack; empty for a stack that is coming. */
    readonly answers: ReadonlyArray<{ readonly id: string; readonly title: string; readonly text: string }>
    readonly snippet: { readonly file: string; readonly lang: string; readonly code: string } | undefined
    /** The folder of the main files ("modules/platform/event-bus"). */
    readonly folder: string
    readonly files: ReadonlyArray<{ readonly id: string; readonly path: string; readonly note: string }>
    /** The folder on GitHub; empty without one. */
    readonly url: string
    readonly repo: string
}

/** Every word of the Pattern part. */
export type PatternLabels = {
    /** The line over the tabs: the five essences set in a real framework, not graded. */
    readonly intro: string
    readonly stacks: string
    readonly questions: string
    readonly snippet: string
    readonly files: (folder: string) => string
    readonly filesEmpty: string
    readonly soon: string
    readonly github: string
}
