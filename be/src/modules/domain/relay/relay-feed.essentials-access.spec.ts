import { FakeClock, mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import {
    ENTITLEMENT_OPTIONS,
    EntitlementService,
    ENTITLEMENT_SERVICE,
    type EntitlementOptions,
} from "@modules/domain/entitlement"
import { LessonContentService, LessonSourceService } from "@modules/domain/lesson"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { REALTIME_HUB, type RealtimeHub } from "@modules/platform/realtime"
import { RELAY_OPTIONS } from "./relay.decorators"
import { RelayFeedService } from "./relay-feed.service"
import { RelayLessonService, type LessonScenarioRunView } from "./relay-lesson.service"

const NOW = "2026-11-17T02:00:00.000Z"
const LEARNER = "b8099f0e-58c7-4685-8292-f3a49ec994b1"
const DEVICE = { learnerId: LEARNER, deviceId: "11111111-1111-4111-8111-111111111111" }
const PACK = { content: Buffer.from("tgz"), sha256: "abc", lessonId: "outbox-idempotency", commit: "c0ffee" }

const runOf = (scenarioId: string, challengeTier: string | null): LessonScenarioRunView => ({
    scenarioId,
    status: "passed",
    runId: `run-${scenarioId}`,
    slot: challengeTier === null ? "scenario" : "challenge",
    ref: null,
    exitCode: 0,
    durationMs: 10,
    commit: null,
    output: null,
    challengeTier,
    guardsOff: [],
    concepts: [],
    why: null,
    ledger: null,
    at: NOW,
})

/** The relay feed over the real content gate and the real entitlement: only the database, the hub and the lesson store are fakes. */
const build = async (options: EntitlementOptions, isPremium: boolean) => {
    // The only query these doors make before the gate is the learner's entitlement row.
    const em = {
        query: jest
            .fn()
            .mockResolvedValue(
                isPremium
                    ? [
                          {
                              learner_id: LEARNER,
                              premium_until: new Date("2027-01-01T00:00:00.000Z"),
                              updated_at: new Date(NOW),
                          },
                      ]
                    : [],
            ),
    }
    const hub = mock<RealtimeHub>()
    hub.publish.mockResolvedValue()
    const sources = mock<LessonSourceService>()
    sources.archive.mockResolvedValue(PACK)
    const lessons = mock<RelayLessonService>()
    lessons.runs.mockResolvedValue([runOf("happy-path", null), runOf("h-easy-key-reuse-409", "easy")])
    const moduleRef = await Test.createTestingModule({
        providers: [
            RelayFeedService,
            LessonContentService,
            EntitlementService,
            { provide: ENTITLEMENT_SERVICE, useExisting: EntitlementService },
            { provide: ENTITLEMENT_OPTIONS, useValue: options },
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: REALTIME_HUB, useValue: hub },
            { provide: RELAY_OPTIONS, useValue: { manifestSigningKey: null } },
            { provide: LessonSourceService, useValue: sources },
            { provide: RelayLessonService, useValue: lessons },
        ],
    }).compile()
    return { feed: moduleRef.get(RelayFeedService), hub, sources, lessons }
}

const PREMIUM_REQUIRED = { code: "LESSON_PREMIUM_REQUIRED" }

describe("the relay doors of an Essentials lesson, for a free learner (default setting: only Bản chất is free)", () => {
    it("refuses source.tgz and never reads the source", async () => {
        const { feed, sources } = await build({}, false)

        await expect(feed.sourceDownload(DEVICE, "outbox-idempotency")).rejects.toMatchObject(PREMIUM_REQUIRED)
        expect(sources.archive).not.toHaveBeenCalled()
    })

    it("refuses the lesson run manifest, scenario and challenge alike, and pushes nothing to the device", async () => {
        const { feed, hub } = await build({}, false)

        await expect(
            feed.manifest(DEVICE, "lesson:outbox-idempotency", { scenario: "happy-path" }),
        ).rejects.toMatchObject(PREMIUM_REQUIRED)
        await expect(feed.manifest(DEVICE, "lesson:outbox-idempotency", { challenge: "easy" })).rejects.toMatchObject(
            PREMIUM_REQUIRED,
        )
        expect(hub.publish).not.toHaveBeenCalled()
    })

    it("refuses a scenario run the learner's AI asks for through the tutor", async () => {
        const { feed, hub } = await build({}, false)

        await expect(
            feed.scenarioManifest(DEVICE, { lessonId: "outbox-idempotency", scenarioId: "happy-path", guardsOff: [] }),
        ).rejects.toMatchObject(PREMIUM_REQUIRED)
        expect(hub.publish).not.toHaveBeenCalled()
    })

    it("refuses the run results, scenario and challenge, and reads none", async () => {
        const { feed, lessons } = await build({}, false)

        await expect(feed.lessonRuns(LEARNER, "outbox-idempotency")).rejects.toMatchObject(PREMIUM_REQUIRED)
        expect(lessons.runs).not.toHaveBeenCalled()
    })
})

describe("the relay doors of an Essentials lesson, for a Premium learner", () => {
    it("serves source.tgz and every run", async () => {
        const { feed } = await build({}, true)

        await expect(feed.sourceDownload(DEVICE, "outbox-idempotency")).resolves.toBe(PACK)
        const runs = await feed.lessonRuns(LEARNER, "outbox-idempotency")
        expect(runs.map((run) => run.scenarioId)).toEqual(["happy-path", "h-easy-key-reuse-409"])
    })
})

describe("the relay doors follow the free-parts setting", () => {
    it("serves source.tgz to a free learner once Source is a free part, and still refuses the runs", async () => {
        const { feed } = await build({ essentialFreeParts: ["1-essential", "2-source"] }, false)

        await expect(feed.sourceDownload(DEVICE, "outbox-idempotency")).resolves.toBe(PACK)
        await expect(feed.lessonRuns(LEARNER, "outbox-idempotency")).rejects.toMatchObject(PREMIUM_REQUIRED)
    })

    it("answers only the scenario runs when Kịch bản is free and Tự áp dụng is not", async () => {
        const { feed } = await build({ essentialFreeParts: ["1-essential", "3-scenarios"] }, false)

        const runs = await feed.lessonRuns(LEARNER, "outbox-idempotency")
        expect(runs.map((run) => run.scenarioId)).toEqual(["happy-path"])
    })
})
