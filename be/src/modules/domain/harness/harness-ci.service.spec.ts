import { Test } from "@nestjs/testing"
import { FakeClock, fakeInbox, mock, mockEntityManager } from "@starci/jest-preset"
import { EXPERIENCE_PRODUCER, type ExperienceProducer } from "@modules/domain/career"
import { PROJECT_CI_ATTESTATION, type CiAttestationVerifier } from "@modules/domain/project"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { INBOX } from "@modules/platform/inbox"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { HarnessErrorCode } from "./errors/harness.error"
import type { HarnessProofRow } from "./harness.contracts"
import type { StoredBuild } from "./harness-progress.policy"
import { HarnessCiService } from "./harness-ci.service"
import { HarnessReadService } from "./harness-read.service"
import type { BindingRow } from "./persistence/harness.rows"
import { INSERT_PROOF, SELECT_BINDING_BY_ID, SET_BINDING_REPOSITORY_ID } from "./persistence/harness.sql"

const NOW = new Date("2026-11-17T03:00:00.000Z")
const LEARNER = "20000000-0000-4000-8000-000000000002"
const BINDING = "30000000-0000-4000-8000-000000000003"

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

const ROW: BindingRow = {
    build_id: "agent-cli",
    learner_id: LEARNER,
    binding_id: BINDING,
    repository: "learner/agent",
    repository_id: null,
}

const PROOFS: ReadonlyArray<HarnessProofRow> = ["a", "b"].map((e2eId) => ({
    buildId: "agent-cli",
    stageId: "s1",
    e2eId,
    passed: true,
    runId: "777-1",
    commit: "abc1234",
    at: NOW.toISOString(),
}))

const bodyOf = (harness: ReadonlyArray<unknown>): Buffer =>
    Buffer.from(JSON.stringify({ runId: "777-1", commit: "ABC1234", passed: true, results: [], harness }))

const BOTH = [
    { build: "agent-cli", stage: "s1", e2e: "a", passed: true },
    { build: "agent-cli", stage: "s1", e2e: "b", passed: true },
]

const build = async (
    options: { binding?: BindingRow | null; attested?: boolean; proofs?: ReadonlyArray<HarnessProofRow> } = {},
) => {
    const em = mockEntityManager({
        query: [
            [SELECT_BINDING_BY_ID, options.binding === null ? [] : [options.binding ?? ROW]],
            [INSERT_PROOF, [{ e2e_id: "a" }]],
            [SET_BINDING_REPOSITORY_ID, []],
        ],
    })
    const attestation = mock<CiAttestationVerifier>()
    attestation.attest.mockResolvedValue(
        options.attested === false
            ? { kind: "signed-only", reason: "token" }
            : { kind: "attested", repositoryId: "42" },
    )
    const reads = mock<HarnessReadService>()
    reads.storedBuilds.mockResolvedValue([BUILD])
    reads.proofs.mockResolvedValue(options.proofs ?? PROOFS)
    const experiences = mock<ExperienceProducer>()
    const inbox = fakeInbox()
    const moduleRef = await Test.createTestingModule({
        providers: [
            HarnessCiService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: LOGGER, useValue: mock<Logger>() },
            { provide: INBOX, useValue: inbox },
            { provide: PROJECT_CI_ATTESTATION, useValue: attestation },
            { provide: EXPERIENCE_PRODUCER, useValue: experiences },
            { provide: HarnessReadService, useValue: reads },
        ],
    }).compile()
    return { service: moduleRef.get(HarnessCiService), em, attestation, experiences, inbox }
}

const deliver = (service: HarnessCiService, harness: ReadonlyArray<unknown> = BOTH, token: string | null = "gh.jwt") =>
    service.recordRun({ bindingId: BINDING, rawBody: bodyOf(harness), oidcToken: token ?? undefined })

describe("HarnessCiService recordRun", () => {
    it("records the e2e results of an attested run of the bound repository as proof and hands the proved build to the experience engine", async () => {
        const { service, em, attestation, experiences } = await build()

        await expect(deliver(service)).resolves.toEqual({ recorded: 2 })

        expect(attestation.attest).toHaveBeenCalledWith({
            token: "gh.jwt",
            repository: "learner/agent",
            repositoryId: null,
            commit: "abc1234",
            runId: "777-1",
        })
        expect(em.query).toHaveBeenCalledWith(INSERT_PROOF, [
            LEARNER,
            "agent-cli",
            "s1",
            "a",
            "777-1",
            true,
            "abc1234",
            BINDING,
            NOW,
        ])
        expect(em.query).toHaveBeenCalledWith(SET_BINDING_REPOSITORY_ID, [BINDING, "42"])
        expect(experiences.produce).toHaveBeenCalledWith(
            expect.objectContaining({
                itemType: "harness.build-proved",
                subject: "agent-cli",
                projectId: null,
                learnerId: LEARNER,
            }),
        )
    })

    it("needs no Project and no Premium: nothing of the project or entitlement capability is injected", async () => {
        const { service, experiences } = await build()

        await expect(deliver(service)).resolves.toEqual({ recorded: 2 })

        expect(experiences.produce).toHaveBeenCalledTimes(1)
    })

    it("refuses a run GitHub did not vouch for, or one with no token, and records nothing so the Action fails", async () => {
        const unattested = await build({ attested: false })
        const bare = await build()

        await expect(deliver(unattested.service)).rejects.toMatchObject({ code: HarnessErrorCode.CiNotAttested })
        await expect(deliver(bare.service, BOTH, null)).rejects.toMatchObject({
            code: HarnessErrorCode.CiNotAttested,
        })

        expect(unattested.em.query).not.toHaveBeenCalledWith(INSERT_PROOF, expect.anything())
        expect(bare.attestation.attest).not.toHaveBeenCalled()
    })

    it("gives the claim back when a run is refused, so the retry of the Action is attested again", async () => {
        const { service, attestation } = await build({ attested: false })

        await expect(deliver(service)).rejects.toBeDefined()
        await expect(deliver(service)).rejects.toBeDefined()

        expect(attestation.attest).toHaveBeenCalledTimes(2)
    })

    it("claims the run first: a repeat of the same run id records and attests nothing", async () => {
        const { service, attestation, inbox } = await build()

        await deliver(service)
        await expect(deliver(service)).resolves.toEqual({ recorded: 0 })

        expect(inbox.claims).toHaveLength(2)
        expect(attestation.attest).toHaveBeenCalledTimes(1)
    })

    it("refuses an unknown binding and a document that is not the result document before anything is claimed", async () => {
        const unknown = await build({ binding: null })
        const { service, inbox } = await build()

        await expect(deliver(unknown.service)).rejects.toMatchObject({ code: HarnessErrorCode.CiBindingUnknown })
        await expect(
            service.recordRun({ bindingId: "not-a-uuid", rawBody: bodyOf(BOTH), oidcToken: "t" }),
        ).rejects.toMatchObject({
            code: HarnessErrorCode.CiBindingUnknown,
        })
        await expect(
            service.recordRun({ bindingId: BINDING, rawBody: Buffer.from("not json"), oidcToken: "t" }),
        ).rejects.toMatchObject({ code: HarnessErrorCode.CiPayloadInvalid })
        await expect(deliver(service, [])).rejects.toMatchObject({ code: HarnessErrorCode.CiPayloadInvalid })
        expect(inbox.claims).toEqual([])
    })

    it("ignores another build, an unknown stage or e2e id, and makes no CV item while an e2e has no attested result", async () => {
        const { service, em, experiences } = await build({ proofs: PROOFS.slice(0, 1) })

        await expect(
            deliver(service, [
                { build: "other", stage: "s1", e2e: "a", passed: true },
                { build: "agent-cli", stage: "ghost", e2e: "a", passed: true },
                { build: "agent-cli", stage: "s1", e2e: "ghost", passed: true },
                { build: "agent-cli", stage: "s1", e2e: "a", passed: true },
            ]),
        ).resolves.toEqual({ recorded: 1 })

        expect(em.query.mock.calls.filter(([text]) => text === INSERT_PROOF)).toHaveLength(1)
        expect(experiences.produce).not.toHaveBeenCalled()
    })

    it("keeps the repository id it already knew and does not write it again", async () => {
        const { service, em } = await build({ binding: { ...ROW, repository_id: "42" } })

        await deliver(service)

        expect(em.query).not.toHaveBeenCalledWith(SET_BINDING_REPOSITORY_ID, expect.anything())
    })
})
