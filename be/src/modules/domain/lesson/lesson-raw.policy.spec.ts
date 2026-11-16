import type { LessonSourceFile } from "./lesson-import.contracts"
import { convertRawLesson } from "./lesson-raw.policy"
import type { LessonTopicCatalog } from "./lesson-topic.contracts"

const SEP = "<!-- @starci/seperator -->"
const fileOf = (path: string, text: string): LessonSourceFile => ({ path, text, sha256: `sha-${path}` })
const field = (name: string, value: string): string => `# ${name}\n${SEP}\n${value}\n${SEP}\n`

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

const quizOf = (): string => `
questions:
${[1, 2, 3, 4, 5]
    .map(
        (n) => `  - id: q${n}
    readSection: "1"
    scenario: happy-path
    prompt: { vi: "Q${n}", en: "Q${n}" }
    options:
      - { id: a, correct: true, text: { vi: "A", en: "A" }, explanation: { vi: "E", en: "E" } }
      - { id: b, correct: false, text: { vi: "B", en: "B" }, explanation: { vi: "E", en: "E" } }`,
    )
    .join("\n")}
`

const SCENARIOS = `
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

const CHALLENGES = `
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

const lessonFiles = (
    rootExtra: string,
    scenarios = SCENARIOS,
    challenges = CHALLENGES,
): ReadonlyArray<LessonSourceFile> => [
    fileOf("vi.md", root(rootExtra)),
    fileOf("en.md", root(rootExtra)),
    ...["1-essential", "2-source", "3-scenarios", "4-apply"].flatMap((part) => [
        fileOf(`sections/${part}/vi.md`, section(part)),
        fileOf(`sections/${part}/en.md`, section(part)),
    ]),
    fileOf("sections/1-essential/quiz.yaml", quizOf()),
    fileOf("scenarios.yaml", scenarios),
    fileOf("sections/4-apply/challenges.yaml", challenges),
    fileOf("hidden/challenge-scenarios.yaml", PLAN),
    fileOf("hidden/essence-answers.yaml", "answers: {}"),
    fileOf("hidden/tests/easy.test.ts", "// hidden test"),
]

const CATALOG: LessonTopicCatalog = {
    byLesson: {},
    sources: {},
    topics: { "api-reliability": { title: "API reliability", from: "x", modules: [] } },
}

const convert = (files: ReadonlyArray<LessonSourceFile>) =>
    convertRawLesson({ topic: "api-reliability", folder: "outbox", files }, CATALOG)

const hiddenOf = (files: ReadonlyArray<LessonSourceFile>) =>
    convert(files).draft?.content.locales.vi.essential?.challenges[0]?.hidden?.[0]

describe("convertRawLesson reads the scenario and root fields when the lesson has them", () => {
    it("takes expected per locale, the invariant, and the category and difficulty of the root", () => {
        const { draft, issues } = convert(lessonFiles(field("category", "backend") + field("difficulty", "advanced")))

        expect(issues).toEqual([])
        expect(draft).toMatchObject({ category: "backend", group: "backend", difficulty: "advanced" })
        const vi = draft?.content.locales.vi.essential?.scenarios[0]
        const en = draft?.content.locales.en.essential?.scenarios[0]
        expect(vi).toMatchObject({ invariant: "effect-once", expected: "Sổ in verdict OK" })
        expect(en?.expected).toBe("The ledger prints verdict OK")
    })

    it("reads a plain-text expected for both locales and leaves it empty without one", () => {
        const plain = SCENARIOS.replace(/expected:\n\s+vi: .*\n\s+en: .*\n/u, 'expected: "one text"\n')
        expect(convert(lessonFiles("", plain)).draft?.content.locales.en.essential?.scenarios[0]?.expected).toBe(
            "one text",
        )
        const none = SCENARIOS.replace(/\s+expected:\n\s+vi: .*\n\s+en: .*/u, "").replace(
            /\s+invariant: effect-once/u,
            "",
        )
        expect(convert(lessonFiles("", none)).draft?.content.locales.vi.essential?.scenarios[0]).toMatchObject({
            expected: "",
            invariant: "",
        })
    })

    it("defaults a root without category and difficulty to backend and intermediate", () => {
        expect(convert(lessonFiles("")).draft).toMatchObject({ category: "backend", difficulty: "intermediate" })
    })

    it("uses the command a hidden scenario names, else the runner form", () => {
        expect(hiddenOf(lessonFiles(""))?.command).toBe("npm test -- --scenario h-easy")
        const derived = CHALLENGES.replace(/\s+command: "npm test -- --scenario h-easy"/u, "")
        expect(hiddenOf(lessonFiles("", SCENARIOS, derived))?.command).toBe("npm test -- --scenario h-easy")
        const custom = CHALLENGES.replace("npm test -- --scenario h-easy", "npm run hidden -- h-easy")
        expect(hiddenOf(lessonFiles("", SCENARIOS, custom))?.command).toBe("npm run hidden -- h-easy")
    })
})
