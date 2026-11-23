/**
 * The four-part lesson (Bản chất, Source, Kịch bản, Tự áp dụng): optional fields of the root file that a lesson written before
 * them simply lacks. Every field is added, none renamed or removed, so the format stays a superset of what the importer read.
 */

/** The languages a lesson's source repository ships; lessons are TypeScript only (owner 2026-11-17). */
export const LESSON_SOURCE_LANGUAGES = ["typescript"] as const

/** One language of a lesson's source repository. */
export type LessonSourceLanguage = (typeof LESSON_SOURCE_LANGUAGES)[number]

/** The rungs of the challenge ladder, easiest first. */
export const LESSON_CHALLENGE_LEVELS = ["easy", "medium", "hard", "insane"] as const

/** One rung of the challenge ladder. */
export type LessonChallengeLevel = (typeof LESSON_CHALLENGE_LEVELS)[number]

/** The one real-world situation a lesson opens with (`story` of `quiz.yaml`): the five opener questions are five developments of it. */
export interface LessonOpenerStory {
    /** The situation in a few words. */
    readonly title: string
    /** The situation as the learner reads it before the first question. */
    readonly body: string
    /** The business line (`bepxanh.com · shop đồ bếp online · bạn phụ trách backend`); absent when the story names none. */
    readonly company?: string
    /** The key figures of the situation, three of them; absent when the story names none. */
    readonly facts?: ReadonlyArray<string>
    /** The whole system as a Mermaid flowchart with its one-line caption, drawn once at the top of Mở đầu (`system` of `quiz.yaml`). */
    readonly system?: LessonOpenerFigure
    /** The lesson's glossary: each term the opener uses, with its one-line definition (`glossary` of `quiz.yaml`). */
    readonly glossary?: ReadonlyArray<LessonGlossaryEntry>
}

/** A Mermaid figure and the one line that says where to look. */
export interface LessonOpenerFigure {
    readonly diagram: string
    readonly caption: string
}

/** One term of the lesson's glossary. */
export interface LessonGlossaryEntry {
    readonly term: string
    readonly definition: string
}

/** One numbered step of "Chuyện gì đã xảy ra": who acts, what happens, and whether it is the faulty step. */
export interface LessonOpenerStep {
    readonly who: string
    readonly text: string
    readonly isFault: boolean
}

/** The interview answer in four beats: symptom, cause, fix and cost. */
export interface LessonOpenerInterviewBeats {
    readonly symptom: string
    readonly cause: string
    readonly fix: string
    readonly cost: string
}

/** The development one opener question adds to the story's timeline (`event` of a question); shown with the question. */
export interface LessonOpenerEvent {
    /** When it happens, as the timeline labels it (`21:03`). */
    readonly at: string
    /** What happens. */
    readonly text: string
}

/** The three-part explanation released when the learner picks the right option (`insight` of a question). */
export interface LessonOpenerInsight {
    /** Bản chất: the essence the question tests. */
    readonly essence: string
    /** Vì sao cần: the longer story; empty for an opener written in the four-beat form. */
    readonly why: string
    /** Trả lời phỏng vấn: a model interview answer (the four beats joined, when the question has them). */
    readonly interview: string
    /** The interview answer in four beats; absent for an opener written before them. */
    readonly interviewBeats?: LessonOpenerInterviewBeats
    /** Chuyện gì đã xảy ra: the numbered steps, the faulty one marked. */
    readonly happened?: ReadonlyArray<LessonOpenerStep>
    /** Cách sửa bằng lời thường. */
    readonly fix?: string
    /** Cái giá of the fix. */
    readonly cost?: string
    /** The one line that says where to look in `diagram`. */
    readonly diagramCaption?: string
    /**
     * The one figure of the question, as Mermaid text (a `sequenceDiagram`, `flowchart` or `stateDiagram-v2`, the faulty or deciding
     * step marked); released with the rest of the insight, so it never shows before the right pick. Absent when the question ships none.
     */
    readonly diagram?: string
    /** The demo code: the lines of the lesson's source that show the essence; released with the insight. Absent when it ships none. */
    readonly code?: LessonOpenerCode
}

/** The demo code of an opener question: lines of the lesson's source (or of its buggy copy), where they live and what to look at. */
export interface LessonOpenerCode {
    /** The path inside the lesson folder (`source/src/cache/redis.ts`, `bugs/source/src/products.ts`). */
    readonly file: string
    /** The language of the lines, for highlighting (`ts`, `lua`, `sql`). */
    readonly lang: string
    /** The number of the first line in the file. */
    readonly start: number
    /** The key lines, numbered as in the file. */
    readonly highlight: ReadonlyArray<number>
    /** The lines, as written in the file. */
    readonly code: string
    /** One line on what to look at. */
    readonly note: string
}

/** One multiple-choice interview question: the opener asks five, a challenge's essence check asks its own. */
export interface LessonOpenerQuestion {
    /** The stable id, unique inside the lesson. */
    readonly id: string
    /** The question as the learner reads it. */
    readonly prompt: string
    /** The choices in the order shown. */
    readonly choices: ReadonlyArray<string>
    /** The index of the right choice; never leaves the server before a submit. */
    readonly correctIndex: number
    /** Why the right choice is right; released after the submit. */
    readonly explanation: string
    /** The explanation of each choice, in the order of the choices; released after the submit (the picked one is shown). */
    readonly choiceExplanations?: ReadonlyArray<string>
    /** The article section to read closely when the answer is wrong. */
    readonly sectionId?: string
    /** The heading number inside that section to read closely (`2.2`). */
    readonly sectionRef?: string
    /** The scenario that shows the answer when it is run. */
    readonly scenarioId?: string
    /** The development of the story this question adds; public, shown with the question. */
    readonly event?: LessonOpenerEvent
    /** A few words naming the moment (`Giá cũ quay lại sau DEL`), the line of the question on the lesson rail; public. */
    readonly title?: string
    /** The situation in plain business words, as numbered steps; public. */
    readonly steps?: ReadonlyArray<string>
    /** Chi tiết kỹ thuật: the code and table names, folded; public. */
    readonly technical?: string
    /** The one line that says which parts `contextDiagram` touches; public. */
    readonly contextCaption?: string
    /** The condition the right option must meet, one line under the question ("Điều kiện"); public. */
    readonly condition?: string
    /** What is seen going wrong, one sentence (Kết quả); public. */
    readonly symptom?: string
    /** What the interviewer wants to know: the skill the question tests; public. */
    readonly probe?: string
    /** The system the question touches, as a Mermaid `flowchart`; public, drawn in the context before the answer. */
    readonly contextDiagram?: string
    /** The three-part explanation of the right option; never leaves the server but in the grade of a right pick. */
    readonly insight?: LessonOpenerInsight
    /** For a challenge question: true when the learner also writes a short explanation of it (`writtenRequired`), graded by AI. */
    readonly writtenRequired?: boolean
}

/**
 * How the learner runs the lesson's source. The code itself is the lesson folder's `source/` (owner 2026-11-17: no per-lesson
 * repositories), served as a tarball at the content commit; these fields say where things are inside it.
 */
export interface LessonSourceRepo {
    /** The languages it ships. */
    readonly langs: ReadonlyArray<LessonSourceLanguage>
    /** The branch, tag or sha the lesson was written against. */
    readonly ref?: string
    /** The TypeScript project folder inside `source/` (default `.`). */
    readonly dir?: string
    /** The folder holding docker-compose.yml (default `<dir>/.docker`). */
    readonly compose?: string
    /** The compose project name (default the lesson id). */
    readonly project?: string
}

/** One rule the system keeps, which the code walk, the components and the scenarios point at (`one-effect`). */
export interface LessonInvariant {
    /** The stable id, `[a-z0-9-]+` (the learner CLI reveals it as `[invariant:<id>]`). */
    readonly id: string
    /** The rule in one line. */
    readonly text: string
}

/** One component of the architecture with the rules it keeps. */
export interface LessonArchitectureComponent {
    /** The component (`wallet-service`). */
    readonly name: string
    /** The port it listens on, when it has one. */
    readonly port?: string
    /** What it does, in a few words. */
    readonly role?: string
    /** The invariant ids it keeps. */
    readonly invariants: ReadonlyArray<string>
}

/** The architecture of the source repository. */
export interface LessonArchitecture {
    /** The diagram, in mermaid. */
    readonly diagram: string
    /** The components with the rules each keeps. */
    readonly components: ReadonlyArray<LessonArchitectureComponent>
}

/** One entry of the code walk: where an invariant lives in the repository, as a snippet equal to the file. */
export interface LessonCodeWalkEntry {
    /** The stable id. */
    readonly id: string
    /** The heading. */
    readonly title: string
    /** The invariant id the snippet keeps. */
    readonly invariant: string
    /** The file, relative to the repository root. */
    readonly file: string
    /** The first line of the snippet in the file. */
    readonly line: number
    /** The snippet, byte for byte the lines of the file. */
    readonly snippet: string
    /** Why the code is written so: what breaks without it. */
    readonly why?: string
}

/** A switch of a scenario the learner may turn off (`--guard <name>=off`) to see the fault land. */
export interface LessonScenarioGuard {
    /** The guard name, `[a-z0-9-]+`. */
    readonly name: string
    /** The environment variable the scenario command reads, `[A-Z][A-Z0-9_]*`. */
    readonly env: string
    /** The value that turns it off (default `off`). */
    readonly off?: string
}

/** How the learner CLI runs one scenario: the signed command, where and for how long (SCENARIO-CONTRACT v2). */
export interface LessonScenarioRun {
    /** What the scenario does, with no solution; the CLI's fix prompt quotes it (default the fault). */
    readonly brief?: string
    /** The concept ids it proves, `[a-z0-9-]+`. */
    readonly concepts?: ReadonlyArray<string>
    /** The folder it runs in, relative to the repository (default the source dir). */
    readonly cwd?: string
    /** The JUnit report it writes, relative to the repository (default `<cwd>/reports/junit.xml`). */
    readonly report?: string
    /** When it is stopped, in milliseconds (default 300000). */
    readonly timeoutMs?: number
}

/** One scenario: a fault the learner runs through the learner CLI and the result the relay brings back. */
export interface LessonScenario extends LessonScenarioRun {
    /** The stable id the CLI and the relay name, `[a-z0-9-]+` (`crash-after-debit`). */
    readonly id: string
    /** The title. */
    readonly title: string
    /** The fault it injects, in words. */
    readonly fault: string
    /** The command the learner runs. */
    readonly command: string
    /** The output a correct system shows. */
    readonly expected: string
    /** The invariant id the scenario judges. */
    readonly invariant: string
    /** The guards the learner may switch off (`--guard <name>=off`) to see the fault land. */
    readonly guards: ReadonlyArray<LessonScenarioGuard>
    /** The hint shown when the run is red. */
    readonly hint?: string
}

/** One criterion of a challenge rubric, worth some of its 100 points. */
export interface LessonChallengeCriterion {
    /** The stable id. */
    readonly id: string
    /** The criterion as the learner reads it. */
    readonly criterion: string
    /** The points it is worth. */
    readonly points: number
    /** True for the one critical criterion of a challenge. */
    readonly isCritical?: boolean
}

/** A hidden test source of a challenge: its path in the learner's repository and its file in the lesson folder. */
export interface LessonHiddenFile {
    /** Where the CLI writes it for one run, relative to the repository. */
    readonly path: string
    /** The file in the lesson folder that holds it. */
    readonly from: string
    /** The text, attached by the importer; never leaves the server but in a signed challenge manifest. */
    readonly content?: string
}

/** A hidden scenario of a challenge: never shown, signed into a manifest only for its own tier. */
export interface LessonHiddenScenario extends LessonScenarioRun {
    /** The id, `[a-z0-9-]+`. */
    readonly id: string
    /** The title. */
    readonly title: string
    /** The only command that runs it. */
    readonly command: string
    /** The hidden test sources. */
    readonly files?: ReadonlyArray<LessonHiddenFile>
}

/** One rung of the challenge ladder: built with the learner's AI, judged by hidden scenarios and an essence check. */
export interface LessonChallenge {
    /** The stable id. */
    readonly id: string
    /** The rung. */
    readonly level: LessonChallengeLevel
    /** The title. */
    readonly title: string
    /** What to build, in markdown. */
    readonly brief: string
    /** The rubric; its points add up to 100. */
    readonly rubric: ReadonlyArray<LessonChallengeCriterion>
    /** How many hidden scenarios judge it, when they are not listed in `hidden`. */
    readonly hiddenScenarios?: number
    /** The hidden scenarios; their ids and files never reach a page. */
    readonly hidden?: ReadonlyArray<LessonHiddenScenario>
    /** The essence check: multiple-choice and design-decision questions graded on the spot. */
    readonly questions?: ReadonlyArray<LessonOpenerQuestion>
    /**
     * True when the tier asks a short written explanation of its essence questions (`writtenRequired` on the tier: every question;
     * on a question: that one), from the Khó tier up.
     */
    readonly writtenRequired?: boolean
}

/**
 * One test of the Tìm sạn bug pack (`bugs/tests.yaml`, schema `essentials-bugs@1`): the command the learner CLI runs on the buggy
 * copy, the opener question it belongs to, and what the page says about it. `pass`, `fail` and the hints are earned: `pass` only
 * after the learner's own green run, `fail` after a red one, each hint after the learner opened the ones before it.
 */
export interface LessonBugTest extends LessonScenarioRun {
    /** The stable id, `[a-z0-9-]+`; the relay names its runs `bug:<id>`. */
    readonly id: string
    /** The only command the CLI may run for it. */
    readonly command: string
    /** The opener question id it belongs to, or null (the happy path, the final test). */
    readonly essence: string | null
    /** The title. */
    readonly title: string
    /** "Vì sao giờ đúng": released only after a green run. */
    readonly pass: string
    /** "Vì sao chưa pass": a symptom and a guiding question, released only after a red run. */
    readonly fail: string
    /** What a correct system shows (public, the expected line). */
    readonly expected: string
    /** The label of what the run measured (public, the received line; the value comes from the run). */
    readonly received: string
    /** The hints, direction then file then line; each released only after the ones before it were opened. */
    readonly hints: ReadonlyArray<string>
    /** True for the final test, which opens only once every other test of the pack passed. */
    readonly isFinal: boolean
}

/** The bug pack of Tìm sạn: `bugs/source/` (the buggy copy of `source/`, its own tarball) and its tests. */
export interface LessonBugPack {
    /** The tests, in the order the file lists them (the final one last). */
    readonly tests: ReadonlyArray<LessonBugTest>
}

/** The two states of a Pattern stack: ready to read, or announced. */
export const LESSON_PATTERN_STATUSES = ["ready", "soon"] as const

/** One state of a Pattern stack. */
export type LessonPatternStatus = (typeof LESSON_PATTERN_STATUSES)[number]

/** One file of a Pattern reference with what it holds. */
export interface LessonPatternFile {
    /** The path inside the reference folder. */
    readonly path: string
    /** What it holds. */
    readonly note: string
}

/** The snippet a Pattern stack shows: the business code that only declares the event. */
export interface LessonPatternSnippet {
    /** The language of the code (`ts`). */
    readonly lang: string
    /** The file it comes from. */
    readonly file: string
    /** The code. */
    readonly code: string
}

/** One stack of Pattern (`sections/5-patterns/patterns.yaml`, schema `essentials-patterns@1`): where a real project keeps the pattern. Not graded. */
export interface LessonPattern {
    /** The stack id (`nestjs`, `go`, `spring`, `dotnet`). */
    readonly stack: string
    /** Ready to read, or announced. */
    readonly status: LessonPatternStatus
    /** The GitHub repository (`starci183/patterns-demo`), or empty. */
    readonly repo: string
    /** The folder inside it, or empty. */
    readonly path: string
    /** Đặt code ở đâu. */
    readonly where: string
    /** Áp tới mức nào. */
    readonly howFar: string
    /** Server sập thì sao. */
    readonly whenDown: string
    /** The main files. */
    readonly files: ReadonlyArray<LessonPatternFile>
    /** The snippet, or null. */
    readonly snippet: LessonPatternSnippet | null
}

/** The four-part fields of one locale; a lesson written before them has none. */
export interface LessonEssential {
    /** The situation the opener tells, or absent for a lesson written before the story. */
    readonly story?: LessonOpenerStory | null
    /** The five-question opener. */
    readonly opener: ReadonlyArray<LessonOpenerQuestion>
    /** The source repository, or null. */
    readonly source: LessonSourceRepo | null
    /** The invariants a learner may read: the ones the public scenarios and the code walk name. */
    readonly invariants: ReadonlyArray<LessonInvariant>
    /**
     * The invariants only the hidden challenge scenarios judge. They hint at hidden tests, so no page and no MCP reads them; only
     * the signed manifest of a challenge run names them to the learner CLI, which reveals an id after a run hit it.
     */
    readonly hiddenInvariants?: ReadonlyArray<LessonInvariant>
    /** The architecture, or null. */
    readonly architecture: LessonArchitecture | null
    /** The code walk. */
    readonly codeWalk: ReadonlyArray<LessonCodeWalkEntry>
    /** The scenarios. */
    readonly scenarios: ReadonlyArray<LessonScenario>
    /** The challenge ladder. */
    readonly challenges: ReadonlyArray<LessonChallenge>
    /** The bug pack of Tìm sạn, or absent for a lesson written before it. */
    readonly bugs?: LessonBugPack | null
    /** The Pattern stacks, or absent for a lesson written before them. */
    readonly patterns?: ReadonlyArray<LessonPattern>
}

/** The four-part fields as the root file may carry them, each optional. */
export interface LessonEssentialFields {
    /** The five-question opener. */
    readonly opener?: ReadonlyArray<LessonOpenerQuestion>
    /** The source repository. */
    readonly source?: LessonSourceRepo
    /** The invariants. */
    readonly invariants?: ReadonlyArray<LessonInvariant>
    /** The architecture. */
    readonly architecture?: LessonArchitecture
    /** The code walk. */
    readonly codeWalk?: ReadonlyArray<LessonCodeWalkEntry>
    /** The scenarios. */
    readonly scenarios?: ReadonlyArray<LessonScenario>
    /** The challenge ladder. */
    readonly challenges?: ReadonlyArray<LessonChallenge>
}

/** The activity id an opener question is submitted under: `opener.<question id>`. */
export const openerActivityId = (questionId: string): string => `opener.${questionId}`

/** The activity id a challenge question is submitted under: `challenge.<challenge id>.<question id>`. */
export const challengeActivityId = (challengeId: string, questionId: string): string =>
    `challenge.${challengeId}.${questionId}`

/** The option id of a choice: `c<index>`. */
export const choiceOptionId = (index: number): string => `c${index}`

/** The activity id of the written explanation of a challenge question: `challenge.<challenge id>.<question id>.written`. */
export const challengeWrittenActivityId = (challengeId: string, questionId: string): string =>
    `challenge.${challengeId}.${questionId}.written`

/** The check id a bug-pack test is relayed under, inside the lesson task: `bug:<test id>`. */
export const lessonBugCheckId = (testId: string): string => `bug:${testId}`

/** The prefix of the check ids of the bug pack. */
export const LESSON_BUG_CHECK_PREFIX = "bug:"

/** The section of the practice-led Bản chất reading (`sections/2-essence/<locale>.md`); it is read under the `2-source` part. */
export const LESSON_ESSENCE_SECTION = "2-essence"

/** The relay task a lesson's scenarios run under: `lesson:<lesson id>`; the check id is the scenario id. */
export const lessonRelayTaskId = (lessonId: string): string => `lesson:${lessonId}`
