import { Test } from "@nestjs/testing"
import { FakeClock, mock, mockEntityManager } from "@starci/jest-preset"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { HarnessErrorCode } from "./errors/harness.error"
import type { StoredBuild } from "./harness-progress.policy"
import { HarnessProofService } from "./harness-proof.service"
import { HarnessReadService } from "./harness-read.service"
import { HARNESS_OPTIONS } from "./harness.decorators"
import type { HarnessOptions } from "./harness.options"
import type { BindingRow } from "./persistence/harness.rows"
import { UPSERT_BINDING } from "./persistence/harness.sql"

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
        { id: "s1", order: 1, title: { vi: "Mot", en: "One" }, summary: { vi: "", en: "" }, e2e: ["a"], steps: [] },
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

const build = async (options: HarnessOptions = {}) => {
    const em = mockEntityManager({ query: [[UPSERT_BINDING, [ROW]]] })
    const reads = mock<HarnessReadService>()
    reads.storedBuilds.mockResolvedValue([BUILD])
    const moduleRef = await Test.createTestingModule({
        providers: [
            HarnessProofService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: LOGGER, useValue: mock<Logger>() },
            { provide: HARNESS_OPTIONS, useValue: options },
            { provide: HarnessReadService, useValue: reads },
        ],
    }).compile()
    return { service: moduleRef.get(HarnessProofService), em }
}

describe("HarnessProofService bind", () => {
    it("binds a build of the live catalog to a GitHub repository with no project and no entitlement, and answers the id the workflow sends", async () => {
        const { service, em } = await build()

        await expect(service.bind(LEARNER, "agent-cli", "learner/agent")).resolves.toEqual({
            buildId: "agent-cli",
            repository: "learner/agent",
            bindingId: BINDING,
            audience: "starci-next",
        })

        expect(em.query).toHaveBeenCalledWith(UPSERT_BINDING, [LEARNER, "agent-cli", "learner/agent", NOW])
    })

    it("reads a github.com address as owner/name and names the audience of the deployment", async () => {
        const { service, em } = await build({ ciOidcAudience: "https://api.example.test" })

        const bound = await service.bind(LEARNER, "agent-cli", "https://github.com/Learner/Agent.git")

        expect(em.query).toHaveBeenCalledWith(UPSERT_BINDING, [LEARNER, "agent-cli", "Learner/Agent", NOW])
        expect(bound.audience).toBe("https://api.example.test")
    })

    it("refuses an unknown build as HARNESS_NOT_FOUND and a repository that is not one as HARNESS_REPOSITORY_INVALID before writing", async () => {
        const { service, em } = await build()

        await expect(service.bind(LEARNER, "ghost", "learner/agent")).rejects.toMatchObject({
            code: HarnessErrorCode.NotFound,
        })
        await expect(service.bind(LEARNER, "agent-cli", "not a repo")).rejects.toMatchObject({
            code: HarnessErrorCode.RepositoryInvalid,
        })
        await expect(service.bind(LEARNER, "agent-cli", "https://example.com/a/b")).rejects.toMatchObject({
            code: HarnessErrorCode.RepositoryInvalid,
        })
        expect(em.query).not.toHaveBeenCalled()
    })
})
