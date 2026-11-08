import { createHash } from "node:crypto"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Test } from "@nestjs/testing"
import { reviewDirectory } from "./review-directory.client"

/** The directory reader under test, provided the way Nest provides it so the spec builds its subject from a testing module. */
const SUBJECT = { reviewDirectory }

/** The token the testing module provides the reader under. */
const SUBJECT_TOKEN: unique symbol = Symbol("review.directory-client")

/** Builds the reader under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

describe("reviewDirectory", () => {
    let root: string
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
        root = await mkdtemp(join(tmpdir(), "review-decks-"))
        const deck = (course: string, folder: string) => join(root, "courses", course, "flashcard-decks", folder)
        await mkdir(join(deck("0-fullstack-mastery", "10-b"), "cards", "0-card"), { recursive: true })
        await mkdir(deck("0-fullstack-mastery", "2-a"), { recursive: true })
        await mkdir(deck("0-fullstack-mastery", "readme"), { recursive: true })
        await mkdir(deck("2-devops-mastery", "0-c"), { recursive: true })
        await mkdir(join(root, "courses", "3-ai-llm-mastery"), { recursive: true })
        await writeFile(join(deck("0-fullstack-mastery", "10-b"), "vi.md"), "vi text")
        await writeFile(join(deck("0-fullstack-mastery", "10-b"), "cards", "0-card", "en.md"), "card text")
    })

    afterAll(async () => {
        await rm(root, { recursive: true, force: true })
    })

    it("lists the numbered deck folders of each course in numeric order and skips courses without decks", async () => {
        const decks = await subject.reviewDirectory.decks(root)

        expect(decks.map((deck) => deck.deckId)).toEqual([
            "0-fullstack-mastery/2-a",
            "0-fullstack-mastery/10-b",
            "2-devops-mastery/0-c",
        ])
        expect(decks[0]).toEqual({ deckId: "0-fullstack-mastery/2-a", course: "0-fullstack-mastery", folder: "2-a" })
    })

    it("answers no deck for a checkout without a courses folder", async () => {
        await expect(subject.reviewDirectory.decks(join(root, "nothing"))).resolves.toEqual([])
    })

    it("reads every file of a deck with the SHA-256 of its raw bytes, sorted by posix path", async () => {
        const second = { deckId: "0-fullstack-mastery/10-b", course: "0-fullstack-mastery", folder: "10-b" }

        const files = await subject.reviewDirectory.read(root, second)

        expect(files.map((file) => file.path)).toEqual(["cards/0-card/en.md", "vi.md"])
        expect(files[1]).toEqual({
            path: "vi.md",
            text: "vi text",
            sha256: createHash("sha256").update("vi text").digest("hex"),
        })
    })
})
