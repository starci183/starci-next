import type { ChoiceCardLabels } from "../ChoiceCard"
import type { MarkdownLabels } from "../StudyBody/types"

/** Where the attempt of one question stands, as the choice card draws it. */
export type QuestionStatus = "idle" | "pending" | "saved" | "grading" | "graded" | "failed" | "premium"

/** A link out of a graded question: the section to read closely or the scenario that shows the answer. */
export type QuestionLink = { readonly id: string; readonly label: string; readonly href: string }

/** One multiple-choice question as drawn: the words, the pick and, once graded, the verdict and its explanation. */
export type QuestionCardView = {
    /** The activity id the pick is submitted under. */
    readonly id: string
    readonly prompt: string
    readonly choices: ReadonlyArray<{ readonly id: string; readonly label: string }>
    readonly pickedId: string
    readonly status: QuestionStatus
    readonly isSendFailed: boolean
    readonly isCorrect: boolean
    /** The explanation the grade released; empty before. */
    readonly explanation: string
    /** Where to read or see more after a wrong answer. */
    readonly links: ReadonlyArray<QuestionLink>
}

/** The five-question opener of Bản chất. */
export type OpenerView = {
    readonly questions: ReadonlyArray<QuestionCardView>
    /** The question on screen. */
    readonly index: number
    /** "Câu 2 / 5". */
    readonly position: string
    /** The score once every question is answered ("Đúng 3/5"); empty before. */
    readonly score: string
    /** True while the learner answers the five again at the end of the article. */
    readonly isRetake: boolean
}

/** One section of the article, with its mark when a wrong answer pointed at it. */
export type ArticleSectionView = {
    readonly id: string
    readonly title: string
    readonly markdown: string
    readonly isLocked: boolean
    /** True when a wrong opener answer pointed here ("nên đọc kỹ"). */
    readonly isFlagged: boolean
}

/** The before and after of one opener question. */
export type CompareRowView = {
    readonly id: string
    readonly prompt: string
    readonly before: "right" | "wrong" | "none"
    readonly after: "right" | "wrong" | "none"
}

/** A component of the architecture with the rules it keeps, in words. */
export type ComponentRowView = {
    readonly id: string
    readonly name: string
    readonly port: string
    readonly rules: string
}

/** One entry of the code walk. */
export type CodeWalkView = {
    readonly id: string
    readonly title: string
    /** "C1 · Atomic per wallet". */
    readonly invariant: string
    /** "wallet.service.ts:41". */
    readonly location: string
    readonly snippet: string
    readonly why: string
}

/** The source part: the commands, the architecture and the code walk. */
export type SourcePartView = {
    readonly pullCommand: string
    readonly diagram: string
    readonly components: ReadonlyArray<ComponentRowView>
    readonly codeWalk: ReadonlyArray<CodeWalkView>
}

/** The state of a scenario as its row shows it. */
export type ScenarioState = "none" | "running" | "passed" | "failed" | "guarded"

/** One scenario of Kịch bản with its newest relayed run. */
export type ScenarioCardView = {
    readonly id: string
    readonly title: string
    readonly fault: string
    readonly state: ScenarioState
    /** The words of the state ("Xanh", "Đỏ", "Chưa chạy"). */
    readonly stateLabel: string
    readonly runCommand: string
    /** One command per guard: run with the guard off. */
    readonly guardCommands: ReadonlyArray<string>
    readonly checkCommand: string
    readonly expected: string
    /** The output lines of the newest run; empty before a run. */
    readonly output: ReadonlyArray<string>
    /** "Vì sao sai": the invariant broken and the message of the run; empty unless red. */
    readonly why: string
    readonly invariant: string
    readonly hint: string
    /** The prompt to paste into the learner's AI (Claude, ChatGPT or the IDE agent) to fix a red run. */
    readonly fixPrompt: string
    /** When the newest run was relayed, in words; empty before a run. */
    readonly at: string
}

/** The Kịch bản part. */
export type ScenariosPartView = {
    readonly scenarios: ReadonlyArray<ScenarioCardView>
    readonly selectedId: string
    /** "3/5 kịch bản xanh". */
    readonly summary: string
}

/** One rung of the ladder as the strip shows it. */
export type LadderRungView = {
    readonly id: string
    readonly level: string
    readonly title: string
    readonly state: string
}

/** The rung on screen. */
export type ChallengeCardView = {
    readonly id: string
    readonly heading: string
    readonly brief: string
    readonly rubric: ReadonlyArray<{
        readonly id: string
        readonly criterion: string
        readonly points: string
        readonly isCritical: boolean
    }>
    readonly questions: ReadonlyArray<QuestionCardView>
    readonly runCommand: string
    /** "6/8 kịch bản ẩn xanh" or "Chưa chạy". */
    readonly hiddenState: string
    readonly isLocked: boolean
}

/** The Tự áp dụng part. */
export type ApplyPartView = {
    readonly rungs: ReadonlyArray<LadderRungView>
    readonly selectedId: string
    readonly challenge: ChallengeCardView | undefined
}

/** Every word of the four parts, resolved by the app. */
export type EssentialPartsLabels = {
    readonly choice: ChoiceCardLabels
    readonly markdown: MarkdownLabels
    readonly opener: {
        readonly title: string
        readonly progress: string
        readonly next: string
        readonly previous: string
        readonly right: string
        readonly wrong: string
        readonly readMore: string
        readonly empty: string
    }
    readonly article: {
        readonly title: string
        readonly toc: string
        readonly flagged: string
        readonly locked: string
        readonly empty: string
    }
    readonly retake: {
        readonly title: string
        readonly description: string
        readonly start: string
        readonly question: string
        readonly before: string
        readonly after: string
        readonly right: string
        readonly wrong: string
        readonly none: string
    }
    readonly source: {
        readonly pullTitle: string
        readonly pullNote: string
        readonly architecture: string
        readonly diagram: string
        readonly diagramError: string
        readonly components: string
        readonly component: string
        readonly port: string
        readonly rules: string
        readonly codeWalk: string
        readonly why: string
        readonly empty: string
    }
    readonly scenarios: {
        readonly list: string
        readonly run: string
        readonly guards: string
        readonly expected: string
        readonly output: string
        readonly noOutput: string
        readonly why: string
        readonly invariant: string
        readonly hint: string
        readonly askAi: string
        readonly askAiNote: string
        readonly prompt: string
        readonly check: string
        readonly empty: string
    }
    readonly apply: {
        readonly ladder: string
        readonly brief: string
        readonly rubric: string
        readonly critical: string
        readonly essence: string
        readonly hidden: string
        readonly run: string
        readonly proof: string
        readonly proofSteps: string
        readonly locked: string
        readonly empty: string
    }
    readonly locked: { readonly title: string; readonly description: string; readonly plans: string }
}
