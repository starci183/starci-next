import { Test } from "@nestjs/testing"
import { FakeClock, mock, mockEntityManager } from "@starci/jest-preset"
import { EXPERIENCE_PRODUCER, type ExperienceProducer } from "@modules/domain/career"
import type { HarnessCiRun } from "@modules/domain/project"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { HarnessErrorCode } from "./errors/harness.error"
import type { HarnessProofRow } from "./harness.contracts"
import type { StoredBuild } from "./harness-progress.policy"
import { HarnessProofService } from "./harness-proof.service"
import { HarnessReadService } from "./harness-read.service"
import { INSERT_PROOF, SELECT_BINDINGS, UPSERT_BINDING } from "./persistence/harness.sql"

const NOW = new Date("2026-11-17T03:00:00.000Z")
const LEARNER = "20000000-0000-4000-8000-000000000002"
const PROJECT = "30000000-0000-4000-8000-000000000003"

const BUILD: StoredBuild = {
    id: "agent-cli",
    order: 1,
    title: { vi: "Agent dong lenh", en: "Agent CLI" },
    summary: { vi: "", en: "" },
    keys: [],
    runtime: { dir: "source", install: "npm ci", e2e: "npm run e2e", report: "r.xml" },
    stages: [
        {
            id: "s1",
            order: 1,
            title: { vi: "Mot", en: "One" },
            summary: { vi: "", en: "" },
            e2e: ["a", "b"],
            steps: [],
        },
    ],
    packPaths: [],
}

const RUN: HarnessCiRun = {
    projectId: PROJECT,
    learnerId: LEARNER,
    runId: "gh-1-1",
    commit: "abc1234",
    attested: true,
    results: [
        { build: "agent-cli", stage: "s1", e2e: "a", passed: true },
        { build: "agent-cli", stage: "s1", e2e: "b", passed: true },
    ],
}

const PROOFS: ReadonlyArray<HarnessProofRow> = ["a", "b"].map((e2eId) => ({
    buildId: "agent-cli",
    stageId: "s1",
    e2eId,
    passed: true,
    runId: "gh-1-1",
    commit: "abc1234",
    at: NOW.toISOString(),
}))

const build = async (bound: string | null = PROJECT, proofs: ReadonlyArray<HarnessProofRow> = PROOFS) => {
    const em = mockEntityManager({
        query: [
            [SELECT_BINDINGS, bound === null ? [] : [{ build_id: "agent-cli", project_id: bound }]],
            [INSERT_PROOF, [{ e2e_id: "a" }]],
            [UPSERT_BINDING, [{ build_id: "agent-cli", project_id: PROJECT }]],
        ],
    })
    const reads = mock<HarnessReadService>()
    reads.storedBuilds.mockResolvedValue([BUILD])
    reads.proofs.mockResolvedValue(proofs)
    const experiences = mock<ExperienceProducer>()
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            HarnessProofService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: LOGGER, useValue: logger },
            { provide: EXPERIENCE_PRODUCER, useValue: experiences },
            { provide: HarnessReadService, useValue: reads },
        ],
    }).compile()
    return { service: moduleRef.get(HarnessProofService), em, experiences }
}

describe("HarnessProofService recordRun", () => {
    it("records the e2e results of an attested run of the bound project and hands the proved build to the experience engine", async () => {
        const { service, em, experiences } = await build()

        await service.recordRun(RUN)

        expect(em.query).toHaveBeenCalledWith(INSERT_PROOF, [
            LEARNER,
            "agent-cli",
            "s1",
            "a",
            "gh-1-1",
            true,
            "abc1234",
            PROJECT,
            NOW,
        ])
        expect(em.query).toHaveBeenCalledWith(INSERT_PROOF, [
            LEARNER,
            "agent-cli",
            "s1",
            "b",
            "gh-1-1",
            true,
            "abc1234",
            PROJECT,
            NOW,
        ])
        expect(experiences.produce).toHaveBeenCalledWith(
            expect.objectContaining({
                itemType: "harness.build-proved",
                subject: "agent-cli",
                projectId: PROJECT,
                learnerId: LEARNER,
            }),
        )
    })

    it("records nothing for a signed-only run, which stays practice", async () => {
        const { service, em, experiences } = await build()

        await service.recordRun({ ...RUN, attested: false })

        expect(em.query).not.toHaveBeenCalled()
        expect(experiences.produce).not.toHaveBeenCalled()
    })

    it("records nothing when the build is bound to another project or to none", async () => {
        const other = await build("40000000-0000-4000-8000-000000000004")
        const none = await build(null)

        await other.service.recordRun(RUN)
        await none.service.recordRun(RUN)

        expect(other.em.query).not.toHaveBeenCalledWith(INSERT_PROOF, expect.anything())
        expect(none.em.query).not.toHaveBeenCalledWith(INSERT_PROOF, expect.anything())
        expect(other.experiences.produce).not.toHaveBeenCalled()
    })

    it("ignores a stage, an e2e or a build the live catalog does not have", async () => {
        const { service, em } = await build()

        await service.recordRun({
            ...RUN,
            results: [
                { build: "agent-cli", stage: "ghost", e2e: "a", passed: true },
                { build: "agent-cli", stage: "s1", e2e: "ghost", passed: true },
                { build: "ghost", stage: "s1", e2e: "a", passed: true },
            ],
        })

        expect(em.query).not.toHaveBeenCalledWith(INSERT_PROOF, expect.anything())
    })

    it("makes no CV item while an e2e of the build still has no attested passed result", async () => {
        const { service, experiences } = await build(PROJECT, PROOFS.slice(0, 1))

        await service.recordRun(RUN)

        expect(experiences.produce).not.toHaveBeenCalled()
    })
})

describe("HarnessProofService bind", () => {
    it("binds a build of the live catalog to the project", async () => {
        const { service, em } = await build()

        await expect(service.bind(LEARNER, "agent-cli", PROJECT)).resolves.toEqual({
            buildId: "agent-cli",
            projectId: PROJECT,
        })

        expect(em.query).toHaveBeenCalledWith(UPSERT_BINDING, [LEARNER, "agent-cli", PROJECT, NOW])
    })

    it("refuses an unknown build as HARNESS_NOT_FOUND", async () => {
        const { service } = await build()

        await expect(service.bind(LEARNER, "ghost", PROJECT)).rejects.toMatchObject({ code: HarnessErrorCode.NotFound })
    })
})
