import { Test } from "@nestjs/testing"
import { FakeClock, fakeInbox, mock, mockEntityManager } from "@starci/jest-preset"
import { checkSetServiceOf } from "@tests/fixtures/builders/check-set.builder"
import { PROJECT_LEARNER, PROJECT_NOW } from "@tests/fixtures/builders/project.builder"
import { EXPERIENCE_PRODUCER, type ExperienceProducer } from "@modules/domain/career"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import {
    PROJECT_CI_ATTESTATION,
    ProjectCheckSetService,
    ProjectReadService,
    ProjectService,
    type CiAttestationVerifier,
} from "@modules/domain/project"
import { PROJECT_OPTIONS } from "@modules/domain/project/project.decorators"
import { PROBE_TRANSPORT, type ProbeTransport } from "@modules/integrations/probe"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { INBOX } from "@modules/platform/inbox"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { HarnessCiService } from "./harness-ci.service"
import type { StoredBuild } from "./harness-progress.policy"
import { HarnessProofService } from "./harness-proof.service"
import { HarnessReadService } from "./harness-read.service"
import { HARNESS_OPTIONS } from "./harness.decorators"
import type { BindingRow } from "./persistence/harness.rows"
import {
    INSERT_PROOF,
    SELECT_BINDING_BY_ID,
    SET_BINDING_REPOSITORY_ID,
    UPSERT_BINDING,
} from "./persistence/harness.sql"

const BINDING = "30000000-0000-4000-8000-000000000003"

const BUILD: StoredBuild = {
    id: "agent-cli",
    order: 1,
    title: { vi: "Agent", en: "Agent" },
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
    learner_id: PROJECT_LEARNER,
    binding_id: BINDING,
    repository: "learner/agent",
    repository_id: null,
}

const CREATE: Parameters<ProjectService["create"]>[0] = {
    learnerId: PROJECT_LEARNER,
    name: "Agent",
    kind: "agent",
    topic: "Agents",
    language: "ts",
    stack: "TypeScript",
    track: "claude",
    repoUrl: "https://github.com/learner/agent",
    locale: "en",
}

/** One learner with no Premium, the harness and the project capability side by side. */
const build = async () => {
    const em = mockEntityManager({
        query: [
            [UPSERT_BINDING, [ROW]],
            [SELECT_BINDING_BY_ID, [ROW]],
            [INSERT_PROOF, [{ e2e_id: "a" }]],
            [SET_BINDING_REPOSITORY_ID, []],
        ],
    })
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(false)
    const reads = mock<HarnessReadService>()
    reads.storedBuilds.mockResolvedValue([BUILD])
    reads.proofs.mockResolvedValue([
        {
            buildId: "agent-cli",
            stageId: "s1",
            e2eId: "a",
            passed: true,
            runId: "777-1",
            commit: "abc1234",
            at: PROJECT_NOW.toISOString(),
        },
    ])
    const attestation = mock<CiAttestationVerifier>()
    attestation.attest.mockResolvedValue({ kind: "attested", repositoryId: "42" })
    const experiences = mock<ExperienceProducer>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            HarnessProofService,
            HarnessCiService,
            ProjectService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(PROJECT_NOW) },
            { provide: LOGGER, useValue: mock<Logger>() },
            { provide: INBOX, useValue: fakeInbox() },
            { provide: HARNESS_OPTIONS, useValue: {} },
            { provide: HarnessReadService, useValue: reads },
            { provide: PROJECT_CI_ATTESTATION, useValue: attestation },
            { provide: EXPERIENCE_PRODUCER, useValue: experiences },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: ProjectCheckSetService, useValue: checkSetServiceOf() },
            { provide: ProjectReadService, useValue: mock<ProjectReadService>() },
            { provide: PROBE_TRANSPORT, useValue: mock<ProbeTransport>() },
            { provide: PROJECT_OPTIONS, useValue: {} },
        ],
    }).compile()
    return {
        proof: moduleRef.get(HarnessProofService),
        ci: moduleRef.get(HarnessCiService),
        projects: moduleRef.get(ProjectService),
        entitlement,
        experiences,
    }
}

describe("a learner without Premium on /harness", () => {
    it("binds a build to a repository and proves it from an attested CI run, and the CV item follows, with no entitlement question", async () => {
        const { proof, ci, entitlement, experiences } = await build()

        const bound = await proof.bind(PROJECT_LEARNER, "agent-cli", "learner/agent")
        const receipt = await ci.recordRun({
            bindingId: bound.bindingId,
            rawBody: Buffer.from(
                JSON.stringify({
                    runId: "777-1",
                    commit: "abc1234",
                    passed: true,
                    results: [],
                    harness: [{ build: "agent-cli", stage: "s1", e2e: "a", passed: true }],
                }),
            ),
            oidcToken: "gh.jwt",
        })

        expect(receipt).toEqual({ recorded: 1 })
        expect(experiences.produce).toHaveBeenCalledWith(expect.objectContaining({ itemType: "harness.build-proved" }))
        expect(entitlement.isPremium).not.toHaveBeenCalled()
    })

    it("still cannot create a Project: Projects stay subscription-only", async () => {
        const { projects } = await build()

        await expect(projects.create(CREATE)).rejects.toMatchObject({ code: "PROJECT_PREMIUM_REQUIRED" })
    })
})
