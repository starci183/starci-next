import { Test } from "@nestjs/testing"
import { builder, FakeClock, mock, mockEntityManager } from "@starci/jest-preset"
import { PROJECT_ID, PROJECT_NOW, projectRowOf } from "@tests/fixtures/builders/project.builder"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import type { ProjectOptions } from "./project.options"
import { PROJECT_OPTIONS } from "./project.decorators"
import { ciSignatureOf } from "./project-ci.policy"
import { PROJECT_CI_ATTESTATION, type CiAttestationVerifier } from "./project-ci-attestation.port"
import { ProjectCiService } from "./project-ci.service"
import { ProjectEvidenceService } from "./project-evidence.service"
import type { CiDelivery } from "./project-params.contracts"
import type { RepositoryRow } from "./persistence/project.rows"
import { SELECT_PROJECT_BY_ID, SELECT_PROJECT_REPOSITORY, SET_PROJECT_REPOSITORY_ID } from "./persistence/project.sql"

const SECRET = "a".repeat(64)
const TIMESTAMP = String(PROJECT_NOW.getTime())

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

const build = async (found = true, binding: ReadonlyArray<RepositoryRow> = [BOUND]) => {
    const em = mockEntityManager({
        query: [
            [SELECT_PROJECT_BY_ID, found ? [projectRowOf({ ci_secret: SECRET })] : []],
            [SELECT_PROJECT_REPOSITORY, [...binding]],
            [SET_PROJECT_REPOSITORY_ID, [{ project_id: PROJECT_ID }]],
        ],
    })
    const attestation = mock<CiAttestationVerifier>()
    attestation.attest.mockResolvedValue({ kind: "attested", repositoryId: "42" })
    const evidence = mock<ProjectEvidenceService>()
    evidence.recordCiRun.mockResolvedValue({ duplicate: false, added: 1 })
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            ProjectCiService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(PROJECT_NOW) },
            { provide: LOGGER, useValue: logger },
            { provide: PROJECT_OPTIONS, useValue: builder<ProjectOptions>({})({ ciToleranceMs: 60_000 }) },
            { provide: ProjectEvidenceService, useValue: evidence },
            { provide: PROJECT_CI_ATTESTATION, useValue: attestation },
        ],
    }).compile()
    return { service: moduleRef.get(ProjectCiService), evidence, logger, em, attestation }
}

const delivery = (patch: Partial<CiDelivery> = {}, body: unknown = BODY, secret = SECRET): CiDelivery => {
    const rawBody = Buffer.from(JSON.stringify(body))
    return {
        rawBody,
        projectId: PROJECT_ID,
        timestamp: TIMESTAMP,
        signature: ciSignatureOf(secret, TIMESTAMP, rawBody),
        ...patch,
    }
}

describe("ProjectCiService recordRun", () => {
    it("proves the delivery, records the unattested run's results as signed-only practice and settles it", async () => {
        const { service, evidence, attestation } = await build()

        await expect(service.recordRun(delivery())).resolves.toEqual({ duplicate: false, added: 1 })

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

    it("answers a repeated run id as a duplicate without settling", async () => {
        const { service, evidence } = await build()
        evidence.recordCiRun.mockResolvedValue({ duplicate: true, added: 0 })

        await expect(service.recordRun(delivery())).resolves.toEqual({ duplicate: true, added: 0 })
        expect(evidence.settle).not.toHaveBeenCalled()
    })

    it.each([
        ["a missing body", { rawBody: undefined }],
        ["a missing project header", { projectId: undefined }],
        ["a missing timestamp", { timestamp: undefined }],
        ["a missing signature", { signature: undefined }],
        ["a project id that is not an id", { projectId: "not-a-uuid" }],
        ["a signature that does not match", { signature: "sha256=abc" }],
    ])("refuses %s as PROJECT_CI_SIGNATURE_INVALID and logs it", async (_name, patch) => {
        const { service, evidence, logger } = await build()

        await expect(service.recordRun(delivery(patch))).rejects.toMatchObject({ code: "PROJECT_CI_SIGNATURE_INVALID" })

        expect(evidence.recordCiRun).not.toHaveBeenCalled()
        expect(logger.warn).toHaveBeenCalledWith("project.ci_refused", { code: "PROJECT_CI_SIGNATURE_INVALID" })
    })

    it("refuses a delivery for no project, or signed with another secret, the same way", async () => {
        const absent = await build(false)
        const other = await build()

        await expect(absent.service.recordRun(delivery())).rejects.toMatchObject({
            code: "PROJECT_CI_SIGNATURE_INVALID",
        })
        await expect(other.service.recordRun(delivery({}, BODY, "b".repeat(64)))).rejects.toMatchObject({
            code: "PROJECT_CI_SIGNATURE_INVALID",
        })
    })
})

describe("ProjectCiService recordRun (part 2)", () => {
    it("refuses a proved delivery outside the replay window before it reads the document", async () => {
        const { service } = await build()
        const stale = String(PROJECT_NOW.getTime() - 120_000)
        const rawBody = Buffer.from("not json")

        await expect(
            service.recordRun({
                rawBody,
                projectId: PROJECT_ID,
                timestamp: stale,
                signature: ciSignatureOf(SECRET, stale, rawBody),
            }),
        ).rejects.toMatchObject({ code: "PROJECT_CI_STALE" })
    })

    it("refuses a proved delivery whose body is not the result document", async () => {
        const { service } = await build()
        const rawBody = Buffer.from("not json")

        await expect(
            service.recordRun({
                rawBody,
                projectId: PROJECT_ID,
                timestamp: TIMESTAMP,
                signature: ciSignatureOf(SECRET, TIMESTAMP, rawBody),
            }),
        ).rejects.toMatchObject({ code: "PROJECT_CI_PAYLOAD_INVALID" })
    })
})

describe("ProjectCiService recordRun attestation", () => {
    it("records a run GitHub vouches for as attested proof and keeps the repository id it named first", async () => {
        const { service, evidence, attestation, em } = await build()

        await service.recordRun(delivery({ oidcToken: "oidc.jwt" }))

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
        const { service, attestation, em } = await build(true, [{ ...BOUND, github_repository_id: "42" }])

        await service.recordRun(delivery({ oidcToken: "oidc.jwt" }))

        expect(attestation.attest).toHaveBeenCalledWith(expect.objectContaining({ repositoryId: "42" }))
        expect(em.query).not.toHaveBeenCalledWith(SET_PROJECT_REPOSITORY_ID, expect.anything())
    })

    it.each([
        ["an empty token", "", [BOUND]],
        ["a project with no binding row", "oidc.jwt", []],
        ["a project with no bound repository", "oidc.jwt", [{ ...BOUND, github_repository: null }]],
    ])("keeps %s signed-only without asking GitHub", async (_name, token, binding) => {
        const { service, evidence, attestation } = await build(true, binding)

        await service.recordRun(delivery({ oidcToken: token }))

        expect(attestation.attest).not.toHaveBeenCalled()
        expect(evidence.recordCiRun).toHaveBeenCalledWith(expect.objectContaining({ attestation: "signed-only" }))
    })

    it("keeps a run GitHub does not vouch for signed-only practice and logs why", async () => {
        const { service, evidence, attestation, logger, em } = await build()
        attestation.attest.mockResolvedValue({ kind: "signed-only", reason: "commit" })

        await service.recordRun(delivery({ oidcToken: "oidc.jwt" }))

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
