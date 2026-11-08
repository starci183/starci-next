import { Test } from "@nestjs/testing"
import {
    answerOf,
    cardTextOf,
    deckFilesOf,
    deckTextOf,
    fieldOf,
    sourceFileOf,
} from "@tests/fixtures/builders/review.builder"
import { buildDeckDraft, deckHashOf, tracksOfCourse } from "./deck-draft.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { buildDeckDraft, deckHashOf, tracksOfCourse }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("review.deck-draft-policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const COURSE = "0-fullstack-mastery"
const FOLDER = "0-module-1"

const without = (path: string) => deckFilesOf().filter((file) => file.path !== path)

const replaced = (path: string, text: string) =>
    deckFilesOf().map((file) => (file.path === path ? sourceFileOf(path, text) : file))

describe("buildDeckDraft", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("builds the draft of a valid deck: titles by locale, bare module slugs, cards in order and free cards counted", () => {
        const { draft, issues } = subject.buildDeckDraft(COURSE, FOLDER, deckFilesOf())

        expect(issues).toEqual([])
        expect(draft).toMatchObject({
            deckId: "0-fullstack-mastery/0-module-1",
            sortIndex: 0,
            difficulty: "hard",
            titles: { vi: "vi Module 1", en: "en Module 1" },
            moduleRefs: ["nestjs-core-and-request-lifecycle"],
            tracks: ["backend-fullstack", "ai-engineer", "founder"],
        })
        expect(draft?.cards.map((card) => [card.itemId, card.isPremium, card.level, card.langs])).toEqual([
            ["card:0-fullstack-mastery/0-module-1/0", false, "junior", null],
            ["card:0-fullstack-mastery/0-module-1/1", true, "senior", "go"],
        ])
        expect(draft?.cards[0]?.back.vi.clozes).toEqual([
            { n: 1, term: "container", distractors: ["factory function", "service locator"] },
        ])
        expect(draft?.cards[0]?.front.en.tags).toEqual(["Dependency Injection", "Architecture"])
        expect(draft?.contentHash).toBe(subject.deckHashOf(deckFilesOf()))
    })

    it("hashes the same files to the same value in any order, and other bytes to another value", () => {
        const files = deckFilesOf()

        expect(subject.deckHashOf([...files].reverse())).toBe(subject.deckHashOf(files))
        expect(subject.deckHashOf(files.map((file) => ({ ...file, sha256: `${file.sha256}x` })))).not.toBe(
            subject.deckHashOf(files),
        )
    })

    it("names a missing deck file and a card with one locale", () => {
        const { draft, issues } = subject.buildDeckDraft(COURSE, FOLDER, without("en.md"))
        const half = subject.buildDeckDraft(COURSE, FOLDER, without("cards/1-card/en.md"))

        expect(draft).toBeNull()
        expect(issues).toContainEqual({ path: "en.md", field: "", message: "the deck file is missing" })
        expect(half.issues).toContainEqual({ path: "cards/1-card", field: "", message: "missing en" })
    })

    it("names an empty deck", () => {
        const { issues } = subject.buildDeckDraft(COURSE, FOLDER, [
            sourceFileOf("vi.md", deckTextOf("vi")),
            sourceFileOf("en.md", deckTextOf("en")),
        ])

        expect(issues).toContainEqual({ path: "cards", field: "", message: "the deck has no card" })
    })
})

describe("buildDeckDraft fields", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("names missing fields, a sort index that is not a number and a broken layout", () => {
        const found = subject.buildDeckDraft(COURSE, FOLDER, [
            sourceFileOf("vi.md", `${fieldOf("sortIndex", "x")}stray\n`),
            sourceFileOf("en.md", deckTextOf("en")),
            ...deckFilesOf().filter((file) => file.path.startsWith("cards/0")),
        ])

        expect(found.draft).toBeNull()
        expect(found.issues.map((issue) => `${issue.path}:${issue.field}`)).toEqual(
            expect.arrayContaining([
                "vi.md:sortIndex",
                "vi.md:title",
                "vi.md:description",
                "vi.md:difficulty",
                "vi.md:",
            ]),
        )
    })

    it("names a level, an isPremium and a cloze the format does not allow", () => {
        const bad = subject.buildDeckDraft(
            COURSE,
            FOLDER,
            replaced(
                "cards/0-card/vi.md",
                cardTextOf("vi", { level: "god", isPremium: "maybe", answer: "a {{c1::term::term}} {{c2::x}}" }),
            ),
        )

        const messages = bad.issues.map((issue) => issue.message)
        expect(messages).toEqual(
            expect.arrayContaining([
                "level god is not junior, middle, senior or staff",
                "isPremium is not true or false",
                "cloze c1 has a distractor equal to its term",
                "cloze c2 has no distractor",
            ]),
        )
    })

    it("names vi and en that disagree on cloze numbering, level and isPremium", () => {
        const text = replaced(
            "cards/0-card/en.md",
            cardTextOf("en", { level: "staff", isPremium: "true", answer: answerOf("en").replace("c1", "c2") }),
        )

        const { issues } = subject.buildDeckDraft(COURSE, FOLDER, text)

        expect(issues.map((issue) => issue.message)).toEqual(
            expect.arrayContaining([
                "vi and en have different cloze numbering",
                "vi and en have different levels",
                "vi and en disagree on isPremium",
            ]),
        )
    })
})

describe("buildDeckDraft tracks", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("names two cards with the same sort index and gives an unmapped course no track", () => {
        const twin = replaced("cards/1-card/vi.md", cardTextOf("vi", { sortIndex: "0" }))
        const found = subject.buildDeckDraft(COURSE, FOLDER, twin)

        expect(found.issues).toContainEqual({ path: "cards", field: "sortIndex", message: "sortIndex 0 appears twice" })
        expect(subject.tracksOfCourse("9-unknown")).toEqual([])
        expect(subject.tracksOfCourse("2-devops-mastery")).toEqual(["devops-sre"])
    })

    it("reads a deck without module refs as one with none", () => {
        const files = deckFilesOf().map((file) =>
            file.path === "vi.md" ? sourceFileOf("vi.md", deckTextOf("vi").split("# moduleRefs")[0] ?? "") : file,
        )

        const { draft } = subject.buildDeckDraft(COURSE, FOLDER, files)

        expect(draft?.moduleRefs).toEqual([])
    })

    it("reads a card with no language and no tags as a card without them", () => {
        const text = [
            fieldOf("sortIndex", "0"),
            fieldOf("isPremium", "false"),
            fieldOf("question", "Q?"),
            fieldOf("level", "middle"),
            fieldOf("langs", "  "),
            fieldOf("answer", answerOf("x")),
        ].join("")
        const files = deckFilesOf()
            .filter((file) => !file.path.startsWith("cards/1"))
            .map((file) => (file.path.startsWith("cards/0") ? sourceFileOf(file.path, text) : file))

        const { draft } = subject.buildDeckDraft(COURSE, FOLDER, files)

        expect(draft?.cards[0]).toMatchObject({ langs: null, front: { vi: { tags: [] } } })
    })
})
