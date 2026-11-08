import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { readJson } from "@tests/fixtures/builders/json.builder"
import { deckFilesOf, sourceFileOf } from "@tests/fixtures/builders/review.builder"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { deckHashOf } from "./deck-draft.policy"
import { ReviewErrorCode } from "./errors/review.error"
import { INSERT_CARDS, INSERT_DECK_VERSION, SELECT_DECK_VERSION_HASH, UPSERT_DECK } from "./persistence/review.sql"
import { ReviewImportService } from "./review-import.service"
import { REVIEW_SOURCE, type ReviewSourceReader } from "./review-source.port"
import { ReviewLogEvent } from "./review.log-events"
import type { ReviewSourceDeck, ReviewSourceFile } from "./review.contracts"

const NOW = new Date("2026-11-08T03:00:00.000Z")
const DECK: ReviewSourceDeck = {
    deckId: "0-fullstack-mastery/0-module-1",
    course: "0-fullstack-mastery",
    folder: "0-module-1",
}
const OTHER: ReviewSourceDeck = {
    deckId: "2-devops-mastery/0-module-1",
    course: "2-devops-mastery",
    folder: "0-module-1",
}

const build = async (
    options: { held?: string | null; files?: ReadonlyArray<ReviewSourceFile>; inserted?: boolean } = {},
) => {
    const source = mock<ReviewSourceReader>()
    source.decks.mockResolvedValue([DECK, OTHER])
    source.read.mockResolvedValue(options.files ?? deckFilesOf())
    const logger = mock<Logger>()
    const em = mockEntityManager({
        query: [
            [
                SELECT_DECK_VERSION_HASH,
                options.held === undefined || options.held === null ? [] : [{ content_hash: options.held }],
            ],
            [INSERT_DECK_VERSION, options.inserted === false ? [] : [{ deck_id: DECK.deckId }]],
            [INSERT_CARDS, []],
            [UPSERT_DECK, []],
        ],
    })
    const tx = fakeTransaction(em)
    const moduleRef = await Test.createTestingModule({
        providers: [
            ReviewImportService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: REVIEW_SOURCE, useValue: source },
            { provide: LOGGER, useValue: logger },
        ],
    }).compile()
    return { service: moduleRef.get(ReviewImportService), em, tx, source, logger }
}

/** The item ids of the cards the import wrote, read back from the JSON parameter of the card insert. */
const storedItemIdsOf = (em: ReturnType<typeof mockEntityManager>): ReadonlyArray<string> => {
    const call: unknown = em.query.mock.calls.find((entry) => entry[0] === INSERT_CARDS)
    const json: unknown = Array.isArray(call) && Array.isArray(call[1]) ? call[1][2] : undefined
    if (typeof json !== "string") return []
    const read = readJson(json)
    if (read.kind === "failed" || !Array.isArray(read.value)) return []
    return read.value.flatMap((card: unknown) =>
        typeof card === "object" && card !== null && "item_id" in card && typeof card.item_id === "string"
            ? [card.item_id]
            : [],
    )
}

const params = (only = DECK.deckId) => ({ directory: "data", ref: "origin-main", only })

describe("ReviewImportService import", () => {
    it("stores a new deck version with its cards and makes it the live one, then reports counts and the hash", async () => {
        const { service, em, tx, logger } = await build()

        const reports = await service.import(params())

        expect(reports).toEqual([
            {
                deckId: DECK.deckId,
                version: "origin-main",
                status: "created",
                contentHash: deckHashOf(deckFilesOf()),
                files: 6,
                cards: 2,
                freeCards: 1,
                issues: [],
            },
        ])
        expect(tx.commits).toBe(1)
        expect(storedItemIdsOf(em)).toEqual([
            "card:0-fullstack-mastery/0-module-1/0",
            "card:0-fullstack-mastery/0-module-1/1",
        ])
        expect(em.query).toHaveBeenCalledWith(
            UPSERT_DECK,
            expect.arrayContaining([DECK.deckId, "origin-main", "hard", 2, 1, NOW]),
        )
        expect(logger.info).toHaveBeenCalledWith(
            ReviewLogEvent.DeckImported,
            expect.objectContaining({ status: "created" }),
        )
    })

    it("imports every deck of the checkout when no list is given", async () => {
        const { service, source } = await build()

        const reports = await service.import(params(""))

        expect(reports).toHaveLength(2)
        expect(source.read).toHaveBeenCalledTimes(2)
    })

    it("leaves an identical version alone", async () => {
        const { service, tx } = await build({ held: deckHashOf(deckFilesOf()) })

        const reports = await service.import(params())

        expect(reports[0]?.status).toBe("unchanged")
        expect(tx.commits).toBe(0)
    })
})

describe("ReviewImportService import refusals", () => {
    it("refuses other bytes under a stored version with REVIEW_DECK_IMMUTABLE, and stores nothing", async () => {
        const { service, tx } = await build({ held: "0".repeat(64) })

        await expect(service.import(params())).rejects.toMatchObject({ code: ReviewErrorCode.DeckImmutable })
        expect(tx.commits).toBe(0)
    })

    it("refuses a deck that fails validation with REVIEW_DECK_INVALID and stores nothing", async () => {
        const { service, tx, logger } = await build({ files: [sourceFileOf("vi.md", "stray")] })

        await expect(service.import(params())).rejects.toMatchObject({ code: ReviewErrorCode.DeckInvalid })
        expect(tx.commits).toBe(0)
        expect(logger.info).toHaveBeenCalledWith(
            ReviewLogEvent.DeckImported,
            expect.objectContaining({ status: "invalid", cards: 0 }),
        )
    })

    it("refuses a version that appeared between the check and the insert", async () => {
        const { service } = await build({ inserted: false })

        await expect(service.import(params())).rejects.toMatchObject({ code: ReviewErrorCode.DeckImmutable })
    })

    it("rejects a missing directory or ref and a deck the checkout does not hold", async () => {
        const { service } = await build()

        await expect(service.import({ directory: " ", ref: "r", only: "" })).rejects.toMatchObject({
            code: ReviewErrorCode.ImportRejected,
        })
        await expect(service.import({ directory: "d", ref: "", only: "" })).rejects.toMatchObject({
            code: ReviewErrorCode.ImportRejected,
        })
        await expect(service.import(params("no/such"))).rejects.toMatchObject({ code: ReviewErrorCode.ImportRejected })
    })
})
