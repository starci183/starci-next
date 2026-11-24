import type { NoMachineDetailsLabels } from "../NoMachineNotice"
import type { CodeBlockLabels, MarkdownLabels } from "@starci/grammar/common"

/** One block of the reading: its chapter heading line and its markdown. */
export type ReadingChunkView = {
    readonly id: string
    /** The heading line, as the contents and the landmark name it. */
    readonly title: string
    readonly markdown: string
}

/** One chapter of the reading (`## 2. 23:58 · Giá cũ quay lại sau DEL`), as the contents and the reading column draw it. */
export type ReadingChapterView = ReadingChunkView & {
    /** The time of the night it opens at (`23:58`); empty for a chapter that is no moment. */
    readonly at: string
    /** The short title, without the number and the time. */
    readonly label: string
    /** True for the unnumbered intro ("Mở bài: …"): no number, no time; the numbered chapters count after it. */
    readonly isIntro: boolean
    /** True when a missed opener question points here ("Nên đọc kỹ"). */
    readonly isFlagged: boolean
    /** The glossary terms its prose uses, in the order of the glossary: the margin notes of this chapter. */
    readonly terms: ReadonlyArray<ReadingTermView>
}

/** One glossary term of the reading. */
export type ReadingTermView = {
    readonly id: string
    readonly term: string
    readonly definition: string
}

/** What the server answered for one option of a self-check: a wrong pick, the right one, or the reason the right pick released. */
export type ReadingVerdictView = {
    readonly state: "wrong" | "correct" | "reason"
    readonly explanation: string
}

/** One self-check (`:::check{id="…"}`): the question, its options, and what the server answered so far; never the key before a pick. */
export type ReadingCheckView = {
    readonly id: string
    /** The activity a pick is graded under (`check.<id>`). */
    readonly activityId: string
    readonly prompt: string
    readonly options: ReadonlyArray<{ readonly id: string; readonly label: string }>
    /** The verdicts by option id. */
    readonly verdicts: Readonly<Record<string, ReadingVerdictView>>
    /** The option being graded now; empty when none is. */
    readonly pendingId: string
    readonly isSolved: boolean
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

/**
 * The Bản chất part as drawn: the reading in chapters with their glossary terms, the self-checks, the lab panel, the learner's runs and the
 * MCP of the lesson.
 */
export type ReadingView = {
    readonly chapters: ReadonlyArray<ReadingChapterView>
    /** The glossary of the reading; the margin of a chapter shows the terms its prose uses. */
    readonly glossary: ReadonlyArray<ReadingTermView>
    /** The self-checks by id, as the `:::check` markers name them. */
    readonly checks: Readonly<Record<string, ReadingCheckView>>
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
    /** The head of the contents ("Trong phần này"). */
    readonly tocTitle: string
    /** The phone bar's line over a numbered chapter in view ("Chương 2/9"); the intro is not counted in either number. */
    readonly tocPosition: (index: number, total: number) => string
    /** The phone bar's line over the unnumbered intro ("Mở bài"), and the mark before its title in the contents rail. */
    readonly tocIntro: string
    /** The line under the contents: the self-checks solved ("Tự kiểm tra: 1/6 đúng"). */
    readonly checkSummary: (solved: number, total: number) => string
    readonly flagged: string
    readonly locked: string
    /** The head of a self-check ("Tự kiểm tra"). */
    readonly checkTitle: string
    /** The words of a graded self-check. */
    readonly check: {
        readonly label: string
        readonly wrong: string
        readonly correct: string
        readonly whyNot: string
        readonly grading: string
    }
    /** The head of a chapter's margin of terms ("Thuật ngữ"), and its fold words on a narrow frame. */
    readonly glossaryTitle: string
    readonly glossaryFold: (count: number) => string
    /** The compact MCP card: its head, its one line, the copy command and the fold with the full config. */
    readonly mcpTitle: string
    readonly mcpNote: string
    readonly mcpCopy: string
    readonly mcpDetails: string
    readonly mcpConfig: string
    readonly mcpCommand: string
    readonly mcpToken: string
    readonly copy: string
    /** A `mermaid` fence of the reading drawn as a diagram: its accessible name and the title shown when it does not parse. */
    readonly diagram: string
    readonly diagramError: string
    readonly markdown: MarkdownLabels
    /** The words of a code block that names its file (Copy, line ranges). */
    readonly code: CodeBlockLabels
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
    /** The install and login commands folded under "Chi tiết kỹ thuật". */
    readonly machineDetails: NoMachineDetailsLabels
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
