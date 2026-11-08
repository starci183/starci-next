import { createHmac } from "node:crypto"
import { fakeIds } from "@starci/jest-preset"
import { persistPremium } from "../../fixtures/builders/lesson.builder"
import { CI_RUN_ATTESTATIONS, SERVER_NOW_MS } from "../../fixtures/persistence/project.sql"
import { projectModules, useProjectWorld, worldOidcTokenOf } from "../../world/project-world.options"
import { useTestWorld } from "../../world/use-test-world"

const CREATE = {
    name: "Clinic booking",
    kind: "app" as const,
    topic: "Booking",
    language: "go",
    stack: "Go, PostgreSQL",
    track: null,
    repoUrl: "https://github.com/learner/clinic",
    locale: "en" as const,
}

const runOf = (runId: string) => ({
    runId,
    commit: "abc1234",
    passed: true,
    results: [
        { concept: "unit-testing-behavior", slot: "test", ref: "[unit-testing-behavior] guard rejects", passed: true },
    ],
})

/**
 * GitHub attestation of CI runs (integration, decision Q-PJ-1): a signed run is proof only when the run's OIDC token names the
 * bound repository, the commit and the run; otherwise it is recorded signed-only, as practice, over the real database.
 */
describe("project CI attestation (integration)", () => {
    const world = useTestWorld({ modules: projectModules })
    const w = useProjectWorld(world)
    const ids = fakeIds()

    const deliver = async (secret: string, projectId: string, runId: string, oidcToken: string | undefined) => {
        const rows = await w.db()?.query<Array<{ ms: string }>>(SERVER_NOW_MS)
        const timestamp = rows?.[0]?.ms ?? ""
        const rawBody = Buffer.from(JSON.stringify(runOf(runId)))
        const signature = `sha256=${createHmac("sha256", secret).update(timestamp).update(".").update(rawBody).digest("hex")}`
        return w.ci().recordRun({ projectId, rawBody, timestamp, signature, oidcToken })
    }

    const attestationsOf = (projectId: string) =>
        w.db()?.query<Array<{ run_id: string; attestation: string; source: string }>>(CI_RUN_ATTESTATIONS, [projectId])

    it("attests only a run whose token names the bound repository, its commit and its run, and keeps the rest practice", async () => {
        const learnerId = ids.next()
        await persistPremium(w.db(), learnerId)
        const { project, ciSecret } = await w.projects().create({ learnerId, ...CREATE })

        await deliver(ciSecret, project.id, "gh-1", worldOidcTokenOf("learner/clinic", "abc1234", "gh-1"))
        const bound = await w.repositories().set({ learnerId, projectId: project.id, repository: "learner/clinic" })
        await deliver(ciSecret, project.id, "gh-2", undefined)
        await deliver(ciSecret, project.id, "gh-3", worldOidcTokenOf("other/clinic", "abc1234", "gh-3"))
        await deliver(ciSecret, project.id, "gh-4", worldOidcTokenOf("learner/clinic", "fff0000", "gh-4"))
        await deliver(ciSecret, project.id, "gh-5", worldOidcTokenOf("Learner/Clinic", "abc1234", "gh-5"))
        const binding = await w.repositories().view(learnerId, project.id)

        expect(bound).toMatchObject({ repository: "learner/clinic", repositoryId: null, audience: "starci-next" })
        expect(await attestationsOf(project.id)).toEqual([
            { run_id: "gh-1", attestation: "signed-only", source: "ci-signed" },
            { run_id: "gh-2", attestation: "signed-only", source: "ci-signed" },
            { run_id: "gh-3", attestation: "signed-only", source: "ci-signed" },
            { run_id: "gh-4", attestation: "signed-only", source: "ci-signed" },
            { run_id: "gh-5", attestation: "attested", source: "ci" },
        ])
        expect(binding.repositoryId).toBe("4242")
    })

    it("binds only the learner's own project and refuses a repository that is not owner/name", async () => {
        const owner = ids.next()
        const { project } = await w.projects().create({ learnerId: owner, ...CREATE })

        await expect(
            w.repositories().set({ learnerId: ids.next(), projectId: project.id, repository: "learner/clinic" }),
        ).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND" })
        await expect(
            w.repositories().set({ learnerId: owner, projectId: project.id, repository: "not a repo" }),
        ).rejects.toMatchObject({ code: "PROJECT_REPOSITORY_INVALID" })
    })
})
