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

/** The Bản chất part as drawn: the reading in blocks, its contents and the MCP config of the lesson. */
export type ReadingView = {
    readonly chunks: ReadonlyArray<ReadingChunkView>
    readonly toc: ReadonlyArray<ReadingTocRow>
    /** True while the part's section is locked to its title. */
    readonly isLocked: boolean
    /** The client config of the lesson's MCP (`starci-<lesson id>`). */
    readonly mcpConfig: string
    /** The Claude Code command of the same MCP. */
    readonly mcpCommand: string
}

/** Every word of the Bản chất part. */
export type ReadingLabels = {
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
    readonly tilesTitle: string
    readonly compareTitle: string
    readonly expected: string
    readonly received: string
    readonly ring: (passed: number, total: number) => string
    readonly machineNone: string
    readonly machineNoneNote: string
    readonly machineOnline: (name: string) => string
    readonly asideUnlockTitle: string
    readonly asideUnlock: string
    readonly asideUnlocked: string
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
    readonly stacks: string
    readonly questions: string
    readonly snippet: string
    readonly files: (folder: string) => string
    readonly filesEmpty: string
    readonly soon: string
    readonly github: string
    readonly sourceTitle: string
    readonly sourceNote: (repo: string) => string
}
