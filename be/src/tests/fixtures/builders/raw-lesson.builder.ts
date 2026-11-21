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

/** One test of the Tìm sạn bug pack (essentials-bugs@1); `extra` adds lines to the entry. */
export const bugTestOf = (id: string, essence: string | null, extra = ""): string => `  - id: ${id}
    command: "npm test -- --scenario ${id}"
    essence: ${essence ?? "null"}
    title: { vi: "Test ${id}", en: "Test ${id}" }
    pass: { vi: "Đúng vì ${id}", en: "Right because ${id}" }
    fail: { vi: "Chưa pass vì ${id}", en: "Not yet because ${id}" }
    expected: { vi: "mong đợi ${id}", en: "expected ${id}" }
    received: { vi: "thực tế", en: "received" }
    hints:
      - { vi: "Gợi ý 1 ${id}", en: "Hint 1 ${id}" }
      - { vi: "Gợi ý 2 ${id}", en: "Hint 2 ${id}" }
      - { vi: "Gợi ý 3 ${id}", en: "Hint 3 ${id}" }${extra}`

/** The bug pack: the happy path, one test per opener question and the final test, last. */
export const BUG_TESTS = `schema: starci-next-seed-standard/essentials-bugs@1
tests:
${[bugTestOf("happy-path", null), ...[1, 2, 3, 4, 5].map((n) => bugTestOf(`bug-${n}`, `q${n}`)), bugTestOf("ledger-under-chaos", null)].join("\n")}
`

/** The Pattern stacks (essentials-patterns@1): NestJS ready, Go announced. */
export const PATTERNS = `schema: starci-next-seed-standard/essentials-patterns@1
patterns:
  - stack: nestjs
    status: ready
    repo: github.com/starci183/patterns-demo
    path: saga/src/modules/platform/event-bus
    where: { vi: "Ở platform", en: "In platform" }
    howFar: { vi: "Mọi sự kiện rời service", en: "Every event that leaves" }
    whenDown: { vi: "Relay chạy lại", en: "The relay resumes" }
    files:
      - { path: event-bus.service.ts, note: { vi: "publish()", en: "publish()" } }
    snippet: { lang: ts, file: complete.handler.ts, code: "await bus.publish(manager, event)" }
  - stack: go
    status: soon
`

/** The files a five-part lesson adds: the Bản chất reading, the bug pack with its buggy source, and the Pattern stacks. */
export const fivePartFiles = (bugs = BUG_TESTS, patterns = PATTERNS): ReadonlyArray<LessonSourceFile> => [
    fileOf(
        "sections/2-essence/vi.md",
        field("title", "Bản chất") + field("body", "## 2.1.3. Giải thích code\nBản chất: x"),
    ),
    fileOf("sections/2-essence/en.md", field("title", "Essence") + field("body", "## 2.1.3. Code\nEssence: x")),
    fileOf("bugs/tests.yaml", bugs),
    fileOf("bugs/source/package.json", "{}"),
    fileOf("bugs/source/src/partner/order-paid.ts", "// the buggy copy"),
    fileOf("sections/5-patterns/patterns.yaml", patterns),
]
