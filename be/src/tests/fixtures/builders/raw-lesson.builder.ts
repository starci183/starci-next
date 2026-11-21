import type { LessonSourceFile } from "@modules/domain/lesson/lesson-import.contracts"

/** The files of a lesson folder in the topic-based format (`raw/essentials/<topic>/<lesson>`), the smallest that imports. */

const SEP = "<!-- @starci/seperator -->"
const fileOf = (path: string, text: string): LessonSourceFile => ({ path, text, sha256: `sha-${path}` })
export const field = (name: string, value: string): string => `# ${name}\n${SEP}\n${value}\n${SEP}\n`

const root = (extra: string): string =>
    [
        field("sortIndex", "1"),
        field("title", "T"),
        field("description", "D"),
        field("minutesRead", "40"),
        extra,
        field("status", "draft"),
        field("author", "x"),
    ].join("")

const section = (title: string): string =>
    field("title", title) + field("status", "draft") + field("author", "x") + field("body", `## 1. ${title}`)

/** The story the opener tells (essentials-quiz@1): `story` on top, an `event` and an `insight` on each question. */
export const STORY_QUIZ = {
    story: `story:
  title: { vi: "Đêm Black Friday", en: "Black Friday night" }
  body: { vi: "Cổng thanh toán chậm dần.", en: "The payment gateway slows down." }
`,
    event: (n: number): string => `
    event: { at: "21:0${n}", text: { vi: "Diễn biến ${n}", en: "Development ${n}" } }`,
    insight: (n: number): string => `
    insight:
      essence: { vi: "Bản chất ${n}", en: "Essence ${n}" }
      why: { vi: "Vì sao ${n}", en: "Why ${n}" }
      interview: { vi: "Phỏng vấn ${n}", en: "Interview ${n}" }`,
}

/** What the opener of the builder carries beyond its questions: the story and, per question, its event and insight. */
export type QuizStory = {
    readonly story?: string
    readonly event?: (n: number) => string
    readonly insight?: (n: number) => string
}

/** The opener file: five questions, the first option right; with `extra`, the story fields of essentials-quiz@1. */
export const quizOf = (extra: QuizStory = {}): string => `${extra.story ?? ""}
questions:
${[1, 2, 3, 4, 5]
    .map(
        (n) => `  - id: q${n}
    readSection: "1"
    scenario: happy-path
    prompt: { vi: "Q${n}", en: "Q${n}" }${extra.event?.(n) ?? ""}${extra.insight?.(n) ?? ""}
    options:
      - { id: a, correct: true, text: { vi: "A", en: "A" }, explanation: { vi: "E", en: "E" } }
      - { id: b, correct: false, text: { vi: "B", en: "B" }, explanation: { vi: "E", en: "E" } }`,
    )
    .join("\n")}
`

export const SCENARIOS = `
lessonId: outbox
invariants:
  effect-once: "One effect"
scenarios:
  - id: happy-path
    title: "Happy"
    brief: "Do it"
    invariant: effect-once
    expected:
      vi: "Sổ in verdict OK"
      en: "The ledger prints verdict OK"
    concepts: [c]
    command: "npm test -- --scenario happy-path"
    guards: []
`

export const CHALLENGES = `
tiers:
  - tier: easy
    title: { vi: "Dễ", en: "Easy" }
    hiddenScenarios:
      - id: h-easy
        command: "npm test -- --scenario h-easy"
        brief: { vi: "Ẩn", en: "Hidden" }
        concepts: [c]
    rubric:
      - { id: r1, critical: true, score: 40, criterion: { vi: "R", en: "R" } }
      - { id: r2, score: 60, criterion: { vi: "R", en: "R" } }
    essence: []
`

const PLAN = `
tiers:
  - { tier: easy, file: hidden/tests/easy.test.ts, writeTo: scenarios/hidden/easy.test.ts, solution: hidden/solutions/easy, scenarios: [h-easy] }
`

export const lessonFiles = (
    rootExtra: string,
    scenarios = SCENARIOS,
    challenges = CHALLENGES,
    quiz = quizOf(),
): ReadonlyArray<LessonSourceFile> => [
    fileOf("vi.md", root(rootExtra)),
    fileOf("en.md", root(rootExtra)),
    ...["1-essential", "2-source", "3-scenarios", "4-apply"].flatMap((part) => [
        fileOf(`sections/${part}/vi.md`, section(part)),
        fileOf(`sections/${part}/en.md`, section(part)),
    ]),
    fileOf("sections/1-essential/quiz.yaml", quiz),
    fileOf("scenarios.yaml", scenarios),
    fileOf("sections/4-apply/challenges.yaml", challenges),
    fileOf("hidden/challenge-scenarios.yaml", PLAN),
    fileOf("hidden/essence-answers.yaml", "answers: {}"),
    fileOf("hidden/tests/easy.test.ts", "// hidden test"),
]
