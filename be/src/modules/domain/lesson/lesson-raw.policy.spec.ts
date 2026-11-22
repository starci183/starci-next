import {
    BUG_TESTS,
    CHALLENGES,
    PATTERNS,
    SCENARIOS,
    STORY_QUIZ,
    field,
    fivePartFiles,
    lessonFiles,
    quizOf,
} from "@tests/fixtures/builders/raw-lesson.builder"
import type { LessonSourceFile } from "./lesson-import.contracts"
import { convertRawLesson } from "./lesson-raw.policy"
import type { LessonTopicCatalog } from "./lesson-topic.contracts"

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

describe("convertRawLesson reads the topic from topic.yaml", () => {
    const TOPIC_FILE =
        "title: Độ tin cậy\nfrom: seed standard\nmodules: []\ndetails:\n  description: D\n  prerequisites: []\n  related: [caching]\n"
    const withoutTopic: LessonTopicCatalog = { byLesson: {}, sources: {}, topics: {} }

    it("takes the topic of a lesson from the file when the catalog of the code does not know it", () => {
        const files = lessonFiles("")
        const { draft, issues } = convertRawLesson(
            { topic: "api-reliability", folder: "outbox", files, topicFile: TOPIC_FILE },
            withoutTopic,
        )
        expect(issues).toEqual([])
        expect(draft?.topicSource).toMatchObject({ title: "Độ tin cậy", details: { related: ["caching"] } })
    })

    it("lets the file win over the catalog entry of the same topic", () => {
        const { draft } = convertRawLesson(
            { topic: "api-reliability", folder: "outbox", files: lessonFiles(""), topicFile: TOPIC_FILE },
            CATALOG,
        )
        expect(draft?.topicSource.title).toBe("Độ tin cậy")
    })

    it("falls back to the catalog without a file and refuses a topic that neither knows", () => {
        expect(convert(lessonFiles("")).draft?.topicSource.title).toBe("API reliability")
        const none = convertRawLesson(
            { topic: "api-reliability", folder: "outbox", files: lessonFiles("") },
            withoutTopic,
        )
        expect(none.draft).toBeNull()
        expect(none.issues).toContainEqual({
            path: "",
            field: "topic",
            message: "topic api-reliability is not defined",
        })
    })

    it("reports a topic.yaml that cannot be used instead of silently using the catalog", () => {
        const { draft, issues } = convertRawLesson(
            { topic: "api-reliability", folder: "outbox", files: lessonFiles(""), topicFile: "title: T" },
            CATALOG,
        )
        expect(draft).toBeNull()
        expect(issues).toContainEqual({ path: "topic.yaml", field: "", message: "has no from" })
    })
})

describe("convertRawLesson keeps the invariants of the hidden challenge scenarios out of the public list", () => {
    const withPlanInvariants = (): ReadonlyArray<LessonSourceFile> =>
        lessonFiles("").map((file) =>
            file.path === "hidden/challenge-scenarios.yaml"
                ? {
                      ...file,
                      text: `invariants:\n  refund-once: "One refund per order"\n  effect-once: "dup of a public one"\ntiers:\n  - { tier: easy, file: hidden/tests/easy.test.ts, writeTo: scenarios/hidden/easy.test.ts, solution: hidden/solutions/easy, scenarios: [h-easy] }\n`,
                  }
                : file,
        )

    it("lists only the invariants of scenarios.yaml as public and stores the others apart", () => {
        const essential = convert(withPlanInvariants()).draft?.content.locales.vi.essential
        expect(essential?.invariants).toEqual([{ id: "effect-once", text: "One effect" }])
        expect(essential?.hiddenInvariants).toEqual([{ id: "refund-once", text: "One refund per order" }])
    })
})

describe("convertRawLesson reads the story of the opener when quiz.yaml has one", () => {
    const withQuiz = (quiz: string) => convert(lessonFiles("", SCENARIOS, CHALLENGES, quiz))

    it("takes the story, the event of each question and its insight in each locale", () => {
        const { draft, issues } = withQuiz(quizOf(STORY_QUIZ))

        expect(issues).toEqual([])
        const vi = draft?.content.locales.vi.essential
        const en = draft?.content.locales.en.essential
        expect(vi?.story).toEqual({ title: "Đêm Black Friday", body: "Cổng thanh toán chậm dần." })
        expect(en?.story).toEqual({ title: "Black Friday night", body: "The payment gateway slows down." })
        expect(vi?.opener.map((question) => question.event)).toEqual(
            [1, 2, 3, 4, 5].map((n) => ({ at: `21:0${n}`, text: `Diễn biến ${n}` })),
        )
        expect(en?.opener[2]?.insight).toEqual({ essence: "Essence 3", why: "Why 3", interview: "Interview 3" })
        expect(vi?.opener[0]?.explanation).toBe("E")
    })

    it("takes the one diagram an insight releases, as Mermaid text per locale, of any of the three kinds", () => {
        const kinds = ["sequenceDiagram", "flowchart LR", "stateDiagram-v2", "sequenceDiagram", "flowchart TD"]
        const insight = (n: number): string =>
            `${STORY_QUIZ.insight(n)}\n      diagram: { vi: "${kinds[n - 1]}\\n  A-->B: ${n}", en: "${kinds[n - 1]}\\n  A-->B: en ${n}" }`
        const quiz = quizOf({ ...STORY_QUIZ, insight: (n) => (n === 4 ? STORY_QUIZ.insight(n) : insight(n)) })

        const { draft, issues } = withQuiz(quiz)

        expect(issues).toEqual([])
        const vi = draft?.content.locales.vi.essential?.opener ?? []
        const en = draft?.content.locales.en.essential?.opener ?? []
        expect(vi[0]?.insight?.diagram).toBe("sequenceDiagram\n  A-->B: 1")
        expect(en[0]?.insight?.diagram).toBe("sequenceDiagram\n  A-->B: en 1")
        expect(vi[2]?.insight?.diagram).toBe("stateDiagram-v2\n  A-->B: 3")
        expect(vi[3]?.insight).not.toHaveProperty("diagram")
    })

    it("takes the business frame of the story and each question's title, symptom, probe and context diagram", () => {
        const story = `${STORY_QUIZ.story}  company: { vi: "bepxanh.com", en: "bepxanh.com" }\n  facts: [{ vi: "5.000/giây", en: "5,000/s" }, "TTL 30s"]\n`
        const context = (n: number): string =>
            `\n    title: "T${n}"\n    symptom: { vi: "Triệu chứng ${n}", en: "Symptom ${n}" }\n    probe: "Probe ${n}"\n    contextDiagram: "flowchart LR\\n  A --> B${n}"`
        const quiz = quizOf({ ...STORY_QUIZ, story, event: (n) => STORY_QUIZ.event(n) + context(n) })

        const { draft, issues } = withQuiz(quiz)

        expect(issues).toEqual([])
        const vi = draft?.content.locales.vi.essential
        expect(vi?.story).toMatchObject({ company: "bepxanh.com", facts: ["5.000/giây", "TTL 30s"] })
        expect(draft?.content.locales.en.essential?.story?.facts).toEqual(["5,000/s", "TTL 30s"])
        expect(vi?.opener[2]).toMatchObject({
            title: "T3",
            symptom: "Triệu chứng 3",
            probe: "Probe 3",
            contextDiagram: "flowchart LR\n  A --> B3",
        })
    })

    it("takes the four-beat opener: the system and glossary, the numbered situation, and the Vì sao sections", () => {
        const story = `${STORY_QUIZ.story}system:\n  diagram: "flowchart LR\\n  A --> B"\n  caption: { vi: "Nhìn A", en: "Look at A" }\nglossary:\n  - { term: TTL, definition: { vi: "Thời gian sống", en: "Time to live" } }\n`
        const situation = (n: number): string =>
            `\n    steps: [{ vi: "Bước 1", en: "Step 1" }, { vi: "Bước 2", en: "Step 2" }]\n    technical: { vi: "Kỹ thuật ${n}", en: "Technical ${n}" }\n    contextCaption: "Phần ${n}"`
        const insight = (n: number): string => `
    insight:
      happened:
        - { who: { vi: "Lượt đọc", en: "Read" }, text: { vi: "Đọc", en: "Reads" } }
        - { who: { vi: "Lượt đọc", en: "Read" }, text: { vi: "Ghi đè", en: "Overwrites" }, fault: true }
      essence: { vi: "Gốc ${n}", en: "Root ${n}" }
      fix: "Sửa ${n}"
      cost: "Giá ${n}"
      diagram: "sequenceDiagram\\n  A->>B: x"
      diagramCaption: "Nhìn x"
      interview: { symptom: "T", cause: "N", fix: "S", cost: "G" }`
        const quiz = quizOf({ story, event: (n) => STORY_QUIZ.event(n) + situation(n), insight })

        const { draft, issues } = withQuiz(quiz)

        expect(issues).toEqual([])
        const vi = draft?.content.locales.vi.essential
        expect(vi?.story).toMatchObject({
            system: { diagram: "flowchart LR\n  A --> B", caption: "Nhìn A" },
            glossary: [{ term: "TTL", definition: "Thời gian sống" }],
        })
        expect(vi?.opener[1]).toMatchObject({
            steps: ["Bước 1", "Bước 2"],
            technical: "Kỹ thuật 2",
            contextCaption: "Phần 2",
        })
        expect(vi?.opener[1]?.insight).toEqual({
            essence: "Gốc 2",
            why: "",
            interview: "T N S G",
            interviewBeats: { symptom: "T", cause: "N", fix: "S", cost: "G" },
            happened: [
                { who: "Lượt đọc", text: "Đọc", isFault: false },
                { who: "Lượt đọc", text: "Ghi đè", isFault: true },
            ],
            fix: "Sửa 2",
            cost: "Giá 2",
            diagram: "sequenceDiagram\n  A->>B: x",
            diagramCaption: "Nhìn x",
        })
    })

    it("takes the rail title of each question and the demo code its insight releases", () => {
        const title = (n: number): string => `\n    title: { vi: "Khoảnh khắc ${n}", en: "Moment ${n}" }`
        const code = (n: number): string =>
            `${STORY_QUIZ.insight(n)}\n      code:\n        file: source/src/cache/redis.ts\n        lang: ts\n        start: 74\n        highlight: [74]\n        code: "await redis.set(key, value)\\n"\n        note: { vi: "Ghi ${n}", en: "Write ${n}" }`
        const quiz = quizOf({ ...STORY_QUIZ, event: (n) => STORY_QUIZ.event(n) + title(n), insight: code })

        const { draft, issues } = withQuiz(quiz)

        expect(issues).toEqual([])
        const vi = draft?.content.locales.vi.essential?.opener ?? []
        const en = draft?.content.locales.en.essential?.opener ?? []
        expect(vi[1]?.title).toBe("Khoảnh khắc 2")
        expect(en[1]?.title).toBe("Moment 2")
        expect(vi[0]?.insight?.code).toEqual({
            file: "source/src/cache/redis.ts",
            lang: "ts",
            start: 74,
            highlight: [74],
            code: "await redis.set(key, value)",
            note: "Ghi 1",
        })
    })

    it("reports demo code that does not come from the lesson's source", () => {
        const quiz = quizOf({
            insight: (n) =>
                n === 3
                    ? `${STORY_QUIZ.insight(n)}\n      code: { file: src/x.ts, lang: ts, code: "x", note: { vi: "y" } }`
                    : "",
        })

        const { issues } = withQuiz(quiz)

        expect(issues).toEqual([
            expect.objectContaining({
                field: "questions[2].insight.code.file",
                message: "src/x.ts is not a file of source/ or bugs/source/",
            }),
        ])
    })

    it("reports a diagram that is not a Mermaid sequence, flowchart or state diagram", () => {
        const quiz = quizOf({
            insight: (n) => (n === 2 ? `${STORY_QUIZ.insight(n)}\n      diagram: "pie title Giá\\n  A: 1"` : ""),
        })

        const { draft, issues } = withQuiz(quiz)

        expect(draft).toBeNull()
        expect(issues).toEqual([
            expect.objectContaining({
                field: "questions[1].insight.diagram",
                message: "is not Mermaid text that opens with sequenceDiagram, flowchart, stateDiagram-v2",
            }),
        ])
    })

    it("still imports a lesson written before the story: no story, no event, no insight", () => {
        const { draft, issues } = convert(lessonFiles(""))

        expect(issues).toEqual([])
        const vi = draft?.content.locales.vi.essential
        expect(vi?.story).toBeNull()
        expect(vi?.opener[0]).not.toHaveProperty("event")
        expect(vi?.opener[0]).not.toHaveProperty("insight")
    })

    it("keeps the fields optional per question", () => {
        const { draft, issues } = withQuiz(quizOf({ event: (n) => (n === 1 ? STORY_QUIZ.event(n) : "") }))

        expect(issues).toEqual([])
        const opener = draft?.content.locales.vi.essential?.opener ?? []
        expect(opener[0]?.event?.at).toBe("21:01")
        expect(opener[1]).not.toHaveProperty("event")
        expect(draft?.content.locales.vi.essential?.story).toBeNull()
    })

    it("reports a story, an event or an insight it cannot use", () => {
        const eventOf = (n: number): string => {
            if (n === 1) return '\n    event: { at: "late", text: { vi: "x" } }'
            return n === 2 ? "\n    event: soon" : ""
        }
        const broken = quizOf({
            story: "story: just a line\n",
            event: eventOf,
            insight: (n) =>
                n === 3 ? '\n    insight: { essence: { vi: "B" }, why: { vi: "" }, interview: { vi: "P" } }' : "",
        })

        const { draft, issues } = withQuiz(broken)

        expect(draft).toBeNull()
        expect(issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: "sections/1-essential/quiz.yaml", field: "story" }),
                expect.objectContaining({ field: "questions[0].event.at", message: "late is not a time like 21:03" }),
                expect.objectContaining({ field: "questions[1].event" }),
                expect.objectContaining({ field: "questions[2].insight.why", message: "is empty" }),
            ]),
        )
    })
})

describe("convertRawLesson reads the five-part files when the lesson has them", () => {
    const five = (bugs?: string, patterns?: string): ReadonlyArray<LessonSourceFile> => [
        ...lessonFiles(""),
        ...fivePartFiles(bugs, patterns),
    ]
    const issuesOf = (files: ReadonlyArray<LessonSourceFile>) => convert(files).issues
    const BUGS_PATH = "bugs/tests.yaml"

    it("still imports a lesson without any of them, with no bug pack, no pattern and no Bản chất section", () => {
        const { draft, issues } = convert(lessonFiles(""))
        expect(issues).toEqual([])
        const vi = draft?.content.locales.vi
        expect(vi?.essential?.bugs).toBeUndefined()
        expect(vi?.essential?.patterns).toBeUndefined()
        expect(vi?.sections.map((section) => section.id)).not.toContain("2-essence")
        expect(draft?.content.bugsCode).toBeUndefined()
    })

    it("reads the Bản chất reading as the 2-essence section, after the four part sections", () => {
        const { draft, issues } = convert(five())
        expect(issues).toEqual([])
        const essence = draft?.content.locales.vi.sections.find((section) => section.id === "2-essence")
        expect(essence).toMatchObject({ title: "Bản chất", phase: "explore", sortIndex: 5 })
        expect(essence?.body).toContain("2.1.3")
        expect(draft?.content.locales.en.sections.find((section) => section.id === "2-essence")?.title).toBe("Essence")
    })

    it("reads the bug pack per locale, the final test last, and keeps bugs/source apart from source", () => {
        const { draft } = convert(five())
        const tests = draft?.content.locales.vi.essential?.bugs?.tests ?? []
        expect(tests.map((test) => test.id)).toEqual([
            "happy-path",
            "bug-1",
            "bug-2",
            "bug-3",
            "bug-4",
            "bug-5",
            "ledger-under-chaos",
        ])
        expect(tests.map((test) => test.isFinal)).toEqual([false, false, false, false, false, false, true])
        expect(tests[1]).toMatchObject({
            essence: "q1",
            command: "npm test -- --scenario bug-1",
            pass: "Đúng vì bug-1",
            fail: "Chưa pass vì bug-1",
            hints: ["Gợi ý 1 bug-1", "Gợi ý 2 bug-1", "Gợi ý 3 bug-1"],
        })
        expect(draft?.content.locales.en.essential?.bugs?.tests[1]?.pass).toBe("Right because bug-1")
        expect(draft?.content.bugsCode?.map((file) => file.path)).toEqual(["package.json", "src/partner/order-paid.ts"])
        expect(draft?.content.sourceCode ?? []).toEqual([])
    })

    it("takes the test marked final over the last one", () => {
        const marked = BUG_TESTS.replace("  - id: bug-5\n", "  - id: bug-5\n    final: true\n")
        const tests = convert(five(marked)).draft?.content.locales.vi.essential?.bugs?.tests ?? []
        expect(tests.filter((test) => test.isFinal).map((test) => test.id)).toEqual(["bug-5"])
    })

    it("refuses a bug pack whose tests are wrong, once per problem", () => {
        const twice = BUG_TESTS.replace("  - id: bug-2\n", "  - id: bug-1\n")
        expect(issuesOf(five(twice))).toContainEqual({
            path: BUGS_PATH,
            field: "tests[2].id",
            message: "bug-1 is listed twice",
        })
        const stray = BUG_TESTS.replace("essence: q3", "essence: q9")
        expect(issuesOf(five(stray))).toEqual([
            {
                path: BUGS_PATH,
                field: "tests[3].essence",
                message: "q9 is not a question of sections/1-essential/quiz.yaml",
            },
        ])
        const noPass = BUG_TESTS.replace('pass: { vi: "Đúng vì bug-4", en: "Right because bug-4" }', "")
        expect(issuesOf(five(noPass))).toEqual([{ path: BUGS_PATH, field: "tests[4].pass", message: "is empty" }])
        const noCommand = BUG_TESTS.replace('command: "npm test -- --scenario bug-5"', "")
        expect(issuesOf(five(noCommand))).toEqual([{ path: BUGS_PATH, field: "tests[5].command", message: "is empty" }])
        const schema = BUG_TESTS.replace("essentials-bugs@1", "essentials-bugs@2")
        expect(issuesOf(five(schema))[0]).toMatchObject({ path: BUGS_PATH, field: "schema" })
        const upward = BUG_TESTS.replace("  - id: bug-1\n", "  - id: bug-1\n    cwd: ../x\n")
        expect(issuesOf(five(upward))).toEqual([
            { path: BUGS_PATH, field: "tests[1].cwd", message: "../x is not a relative path" },
        ])
    })

    it("refuses tests without their buggy source, and a buggy source without tests", () => {
        const noSource = five().filter((file) => !file.path.startsWith("bugs/source/"))
        expect(issuesOf(noSource)).toEqual([{ path: BUGS_PATH, field: "", message: "comes without bugs/source/" }])
        const noTests = five().filter((file) => file.path !== BUGS_PATH)
        expect(issuesOf(noTests)).toEqual([{ path: "bugs/source/", field: "", message: "has no bugs/tests.yaml" }])
    })

    it("reads the Pattern stacks, the repository as owner/name, and checks a ready stack", () => {
        const patterns = convert(five()).draft?.content.locales.vi.essential?.patterns ?? []
        expect(patterns[0]).toMatchObject({
            stack: "nestjs",
            status: "ready",
            repo: "starci183/patterns-demo",
            path: "saga/src/modules/platform/event-bus",
            where: "Ở platform",
            snippet: { lang: "ts", file: "complete.handler.ts", code: "await bus.publish(manager, event)" },
        })
        expect(patterns[1]).toMatchObject({ stack: "go", status: "soon", repo: "", files: [], snippet: null })
        const bare = PATTERNS.replace('    where: { vi: "Ở platform", en: "In platform" }\n', "")
        expect(issuesOf(five(BUG_TESTS, bare))).toEqual([
            { path: "sections/5-patterns/patterns.yaml", field: "patterns[0].where", message: "is empty" },
        ])
        const stack = PATTERNS.replace("stack: go", "stack: rust")
        expect(issuesOf(five(BUG_TESTS, stack))[0]).toMatchObject({ field: "patterns[1].stack" })
    })

    it("reads writtenRequired on a tier with essence questions, and refuses it on one without", () => {
        const written = CHALLENGES.replace(
            "    essence: []",
            [
                "    writtenRequired: true",
                "    essence:",
                "      - id: e1",
                '        prompt: { vi: "Vì sao?", en: "Why?" }',
                "        options:",
                '          - { id: a, text: { vi: "Đúng", en: "Right" } }',
                '          - { id: b, text: { vi: "Sai", en: "Wrong" } }',
            ].join("\n"),
        )
        const files = lessonFiles("", SCENARIOS, written).map((file) =>
            file.path === "hidden/essence-answers.yaml" ? { ...file, text: "answers: { e1: a }" } : file,
        )
        const { draft, issues } = convert(files)
        expect(issues).toEqual([])
        expect(draft?.content.locales.vi.essential?.challenges[0]?.writtenRequired).toBe(true)
        expect(draft?.content.locales.vi.essential?.challenges[0]?.questions?.[0]?.writtenRequired).toBe(true)
        const perQuestion = convert(
            files.map((file) =>
                file.path === "sections/4-apply/challenges.yaml"
                    ? {
                          ...file,
                          text: file.text
                              .replace("    writtenRequired: true\n", "")
                              .replace("      - id: e1\n", "      - id: e1\n        writtenRequired: true\n"),
                      }
                    : file,
            ),
        )
        expect(perQuestion.issues).toEqual([])
        expect(perQuestion.draft?.content.locales.vi.essential?.challenges[0]).toMatchObject({
            writtenRequired: true,
            questions: [{ id: "e1", writtenRequired: true }],
        })
        const empty = CHALLENGES.replace("    essence: []", "    writtenRequired: true\n    essence: []")
        expect(issuesOf(lessonFiles("", SCENARIOS, empty))).toEqual([
            {
                path: "sections/4-apply/challenges.yaml",
                field: "tiers[0].writtenRequired",
                message: "asks a written explanation of the essence questions, but the tier has none",
            },
        ])
    })
})
