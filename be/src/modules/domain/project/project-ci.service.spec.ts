import { Test } from "@nestjs/testing"
import { FakeClock, fakeInbox, mock, mockEntityManager } from "@starci/jest-preset"
import { PROJECT_ID, PROJECT_NOW, projectRowOf } from "@tests/fixtures/builders/project.builder"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { INBOX } from "@modules/platform/inbox"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { ciSignatureOf } from "./project-ci.policy"
import { PROJECT_CI_ATTESTATION, type CiAttestationVerifier } from "./project-ci-attestation.port"
import { ProjectCiService } from "./project-ci.service"
import { PROJECT_HARNESS, type ProjectHarnessPort } from "./project-harness.port"
import { ProjectEvidenceService } from "./project-evidence.service"
import type { CiDelivery } from "./project-params.contracts"
import type { RepositoryRow } from "./persistence/project.rows"
import { SELECT_PROJECT_BY_ID, SELECT_PROJECT_REPOSITORY, SET_PROJECT_REPOSITORY_ID } from "./persistence/project.sql"

const BODY = {
    runId: "gh-1",
    commit: "ABC1234",
    passed: true,
    results: [
        { concept: "idempotency", slot: "test", ref: "[idempotency] twice", passed: true },
        { concept: "agent-harness-control-loop", slot: "test", ref: "[loop] a", passed: true },
    ],
}

const BOUND: RepositoryRow = { github_repository: "starci/shop", github_repository_id: null }

const build = async (binding: ReadonlyArray<RepositoryRow> = [BOUND], found = true) => {
    const em = mockEntityManager({
        query: [
            [SELECT_PROJECT_BY_ID, found ? [projectRowOf({ ci_secret: "a".repeat(64) })] : []],
            [SELECT_PROJECT_REPOSITORY, [...binding]],
            [SET_PROJECT_REPOSITORY_ID, [{ project_id: PROJECT_ID }]],
        ],
    })
    const attestation = mock<CiAttestationVerifier>()
    attestation.attest.mockResolvedValue({ kind: "attested", repositoryId: "42" })
    const inbox = fakeInbox()
    const harness = mock<ProjectHarnessPort>()
    harness.recordRun.mockResolvedValue(undefined)
    const evidence = mock<ProjectEvidenceService>()
    evidence.recordCiRun.mockResolvedValue({ duplicate: false, added: 1 })
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            ProjectCiService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(PROJECT_NOW) },
            { provide: LOGGER, useValue: logger },
            { provide: INBOX, useValue: inbox },
            { provide: ProjectEvidenceService, useValue: evidence },
            { provide: PROJECT_CI_ATTESTATION, useValue: attestation },
            { provide: PROJECT_HARNESS, useValue: harness },
        ],
    }).compile()
    return { service: moduleRef.get(ProjectCiService), evidence, logger, em, attestation, inbox, harness }
}

const deliveryOf = (oidcToken?: string, body: unknown = BODY): CiDelivery => {
    const rawBody = Buffer.from(JSON.stringify(body))
    const timestamp = String(PROJECT_NOW.getTime())
    return {
        rawBody,
        project: PROJECT_ID,
        timestamp,
        signature: ciSignatureOf("a".repeat(64), timestamp, rawBody),
        oidcToken,
    }
}

const record = (service: ProjectCiService, oidcToken?: string) => service.recordRun(deliveryOf(oidcToken))

describe("ProjectCiService recordRun", () => {
    it("claims the run id first, records the unattested run's results as signed-only practice and settles it", async () => {
        const { service, evidence, attestation, inbox } = await build()

        await expect(record(service)).resolves.toEqual({ duplicate: false, added: 1 })

        expect(inbox.claims).toEqual([{ source: "project-ci", eventId: "gh-1" }])
        expect(evidence.recordCiRun).toHaveBeenCalledWith({
            projectId: PROJECT_ID,
            runId: "gh-1",
            commit: "abc1234",
            passed: true,
            attestation: "signed-only",
            results: [
                {
                    conceptId: "idempotency",
                    slot: "test",
                    source: "ci-signed",
                    passed: true,
                    ref: "[idempotency] twice",
                    runId: "gh-1",
                    commitSha: "abc1234",
                    detail: {},
                    at: PROJECT_NOW,
                },
            ],
        })
        expect(evidence.settle).toHaveBeenCalledWith(expect.objectContaining({ project_id: PROJECT_ID }), [
            `ci:${PROJECT_ID}:gh-1`,
        ])
        expect(attestation.attest).not.toHaveBeenCalled()
    })

    it("hands the harness results of a recorded run to the harness with whether GitHub attested it", async () => {
        const harnessBody = {
            ...BODY,
            harness: [{ build: "agent-cli", stage: "s1-loop", e2e: "loop-calls-tool", passed: true }],
        }
        const { service, harness } = await build()

        await service.recordRun(deliveryOf("gh-token", harnessBody))

        expect(harness.recordRun).toHaveBeenCalledWith({
            projectId: PROJECT_ID,
            learnerId: expect.any(String),
            runId: "gh-1",
            commit: "abc1234",
            attested: true,
            results: harnessBody.harness,
        })
    })

    it("tells the harness a signed-only run was not attested and hands over nothing for a run with no harness results", async () => {
        const harnessBody = {
            ...BODY,
            harness: [{ build: "agent-cli", stage: "s1-loop", e2e: "loop-calls-tool", passed: true }],
        }
        const unattested = await build()
        const plain = await build()

        await unattested.service.recordRun(deliveryOf(undefined, harnessBody))
        await plain.service.recordRun(deliveryOf("gh-token"))

        expect(unattested.harness.recordRun).toHaveBeenCalledWith(expect.objectContaining({ attested: false }))
        expect(plain.harness.recordRun).not.toHaveBeenCalled()
    })

    it("refuses a body that is not the result document before claiming anything", async () => {
        const { service, inbox } = await build()

        await expect(service.recordRun({ ...deliveryOf(), rawBody: Buffer.from("not json") })).rejects.toMatchObject({
            code: "PROJECT_CI_PAYLOAD_INVALID",
        })
        expect(inbox.claims).toEqual([])
    })

    it("gives the claim back and refuses a delivery that names no project", async () => {
        const { service, inbox } = await build([BOUND], false)

        await expect(record(service)).rejects.toMatchObject({ code: "PROJECT_CI_SIGNATURE_INVALID" })
        expect(inbox.released).toEqual([{ source: "project-ci", eventId: "gh-1" }])
    })

    it("returns on a run id the inbox already holds, before attesting or recording anything", async () => {
        const { service, evidence, attestation, inbox } = await build()
        inbox.seen("project-ci", "gh-1")

        await expect(record(service, "token")).resolves.toBeUndefined()
        expect(attestation.attest).not.toHaveBeenCalled()
        expect(evidence.recordCiRun).not.toHaveBeenCalled()
        expect(evidence.settle).not.toHaveBeenCalled()
    })

    it("answers a run id the evidence already holds as a duplicate without settling", async () => {
        const { service, evidence } = await build()
        evidence.recordCiRun.mockResolvedValue({ duplicate: true, added: 0 })

        await expect(record(service)).resolves.toEqual({ duplicate: true, added: 0 })
        expect(evidence.settle).not.toHaveBeenCalled()
    })

    it("gives the claim back when recording fails, so the Action's retry records the run", async () => {
        const { service, evidence, inbox } = await build()
        evidence.recordCiRun.mockRejectedValue(new Error("database down"))

        await expect(record(service)).rejects.toThrow("database down")
        expect(inbox.released).toEqual([{ source: "project-ci", eventId: "gh-1" }])
    })
})

describe("ProjectCiService recordRun attestation", () => {
    it("records a run GitHub vouches for as attested proof and keeps the repository id it named first", async () => {
        const { service, evidence, attestation, em } = await build()

        await record(service, "oidc.jwt")

        expect(attestation.attest).toHaveBeenCalledWith({
            token: "oidc.jwt",
            repository: "starci/shop",
            repositoryId: null,
            commit: "abc1234",
            runId: "gh-1",
        })
        expect(em.query).toHaveBeenCalledWith(SET_PROJECT_REPOSITORY_ID, [PROJECT_ID, "42"])
        expect(evidence.recordCiRun).toHaveBeenCalledWith(
            expect.objectContaining({
                attestation: "attested",
                results: [expect.objectContaining({ source: "ci" })],
            }),
        )
    })

    it("asks GitHub with the id already recorded and records it no second time", async () => {
        const { service, attestation, em } = await build([{ ...BOUND, github_repository_id: "42" }])

        await record(service, "oidc.jwt")

        expect(attestation.attest).toHaveBeenCalledWith(expect.objectContaining({ repositoryId: "42" }))
        expect(em.query).not.toHaveBeenCalledWith(SET_PROJECT_REPOSITORY_ID, expect.anything())
    })

    it.each([
        ["an empty token", "", [BOUND]],
        ["a project with no binding row", "oidc.jwt", []],
        ["a project with no bound repository", "oidc.jwt", [{ ...BOUND, github_repository: null }]],
    ])("keeps %s signed-only without asking GitHub", async (_name, token, binding) => {
        const { service, evidence, attestation } = await build(binding)

        await record(service, token)

        expect(attestation.attest).not.toHaveBeenCalled()
        expect(evidence.recordCiRun).toHaveBeenCalledWith(expect.objectContaining({ attestation: "signed-only" }))
    })

    it("keeps a run GitHub does not vouch for signed-only practice and logs why", async () => {
        const { service, evidence, attestation, logger, em } = await build()
        attestation.attest.mockResolvedValue({ kind: "signed-only", reason: "commit" })

        await record(service, "oidc.jwt")

        expect(logger.info).toHaveBeenCalledWith("project.ci_unattested", { reason: "commit" })
        expect(em.query).not.toHaveBeenCalledWith(SET_PROJECT_REPOSITORY_ID, expect.anything())
        expect(evidence.recordCiRun).toHaveBeenCalledWith(
            expect.objectContaining({
                attestation: "signed-only",
                results: [expect.objectContaining({ source: "ci-signed" })],
            }),
        )
    })
})
