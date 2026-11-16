import { CHALLENGES, SCENARIOS, field, lessonFiles } from "@tests/fixtures/builders/raw-lesson.builder"
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
