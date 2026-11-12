import { Test } from "@nestjs/testing"
import { builder, FakeClock, mock, mockEntityManager } from "@starci/jest-preset"
import { PROJECT_ID, PROJECT_NOW, projectRowOf } from "@tests/fixtures/builders/project.builder"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import type { ProjectOptions } from "./project.options"
import { PROJECT_OPTIONS } from "./project.decorators"
import { ciSignatureOf } from "./project-ci.policy"
import { ProjectCiProofService } from "./project-ci-proof.service"
import type { CiProof } from "./project-params.contracts"
import { SELECT_PROJECT_BY_ID } from "./persistence/project.sql"

const SECRET = "a".repeat(64)
const TIMESTAMP = String(PROJECT_NOW.getTime())

const BODY = {
    runId: "gh-1",
    commit: "ABC1234",
    passed: true,
    results: [{ concept: "idempotency", slot: "test", ref: "[idempotency] twice", passed: true }],
}

const build = async (found = true) => {
    const em = mockEntityManager({
        query: [[SELECT_PROJECT_BY_ID, found ? [projectRowOf({ ci_secret: SECRET })] : []]],
    })
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            ProjectCiProofService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(PROJECT_NOW) },
            { provide: LOGGER, useValue: logger },
            { provide: PROJECT_OPTIONS, useValue: builder<ProjectOptions>({})({ ciToleranceMs: 60_000 }) },
        ],
    }).compile()
    return { verifier: moduleRef.get(ProjectCiProofService), logger }
}

const prove = (
    verifier: ProjectCiProofService,
    patch: Partial<CiProof> = {},
    body: unknown = BODY,
    secret = SECRET,
) => {
    const rawBody = Buffer.from(JSON.stringify(body))
    return verifier.prove({
        project: PROJECT_ID,
        timestamp: TIMESTAMP,
        signature: ciSignatureOf(secret, TIMESTAMP, rawBody),
        body: rawBody,
        ...patch,
    })
}

describe("ProjectCiProofService prove", () => {
    it("proves a delivery signed with the project's secret inside the window", async () => {
        const { verifier } = await build()

        await expect(prove(verifier)).resolves.toBeUndefined()
    })

    it.each([
        ["a missing body", { body: undefined }],
        ["a missing project header", { project: undefined }],
        ["a missing timestamp", { timestamp: undefined }],
        ["a missing signature", { signature: undefined }],
        ["a project id that is not an id", { project: "not-a-uuid" }],
        ["a signature that does not match", { signature: "sha256=abc" }],
    ])("refuses %s as PROJECT_CI_SIGNATURE_INVALID and logs it", async (_name, patch) => {
        const { verifier, logger } = await build()

        await expect(prove(verifier, patch)).rejects.toMatchObject({ code: "PROJECT_CI_SIGNATURE_INVALID" })

        expect(logger.warn).toHaveBeenCalledWith("project.ci_refused", { code: "PROJECT_CI_SIGNATURE_INVALID" })
    })

    it("refuses a delivery for no project, or signed with another secret, the same way", async () => {
        const absent = await build(false)
        const other = await build()

        await expect(prove(absent.verifier)).rejects.toMatchObject({ code: "PROJECT_CI_SIGNATURE_INVALID" })
        await expect(prove(other.verifier, {}, BODY, "b".repeat(64))).rejects.toMatchObject({
            code: "PROJECT_CI_SIGNATURE_INVALID",
        })
    })

    it("refuses a proved delivery outside the replay window", async () => {
        const { verifier } = await build()
        const stale = String(PROJECT_NOW.getTime() - 120_000)
        const rawBody = Buffer.from("{}")

        await expect(
            verifier.prove({
                project: PROJECT_ID,
                timestamp: stale,
                signature: ciSignatureOf(SECRET, stale, rawBody),
                body: rawBody,
            }),
        ).rejects.toMatchObject({ code: "PROJECT_CI_STALE" })
    })
})
