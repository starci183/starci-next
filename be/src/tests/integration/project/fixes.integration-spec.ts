import { fakeIds } from "@starci/jest-preset"
import { projectModules, useProjectWorld } from "../../world/project-world.options"
import { useTestWorld } from "../../world/use-test-world"

const CREATE = {
    name: "Clinic booking",
    kind: "app" as const,
    topic: "Booking",
    language: "go",
    stack: "Go, PostgreSQL",
    track: null,
    repoUrl: null,
    locale: "en" as const,
}

/** An update that names no field but the one a spec adds. */
const NO_CHANGE = { name: null, topic: null, language: null, stack: null, repoUrl: null, deployedUrl: null }

/**
 * The fixes after the API walk (integration): a probe run that got no response moves no concept, a deployed address whose host name
 * resolves inside is refused when it is saved, and a project of the learner is deleted with everything on it.
 */
describe("projects fixes (integration)", () => {
    const world = useTestWorld({ modules: projectModules })
    const w = useProjectWorld(world)
    const ids = fakeIds()

    it("moves no concept when every probe was refused, then proves one when the project answers", async () => {
        const learnerId = ids.next()
        const { project } = await w.projects().create({ learnerId, ...CREATE })
        await w.projects().update({
            learnerId,
            projectId: project.id,
            locale: "en",
            ...NO_CHANGE,
            deployedUrl: "https://app.example.com",
        })
        const lookup = { learnerId, projectId: project.id, locale: "en" } as const

        const refused = await w.probeRuns().run(learnerId, project.id)
        const afterRefused = await w.reads().get(lookup)

        w.probes().reply = { ok: true, status: 200, headers: { "x-request-id": "r" }, body: "" }
        const answered = await w.probeRuns().run(learnerId, project.id)
        const afterAnswered = await w.reads().get(lookup)

        expect(refused.passed).toBe(false)
        expect(refused.results.every((result) => result.reason === "target-refused")).toBe(true)
        expect(afterRefused.practisingConceptCount).toBe(0)
        expect(afterRefused.milestones.every((milestone) => milestone.provedCount === 0)).toBe(true)
        expect(answered.results.length).toBeGreaterThan(0)
        expect(afterAnswered.lastProbeRun).not.toBeNull()
    })

    it("refuses at save a deployed address whose host name resolves inside, and keeps the saved one", async () => {
        const learnerId = ids.next()
        const { project } = await w.projects().create({ learnerId, ...CREATE })
        const change = { learnerId, projectId: project.id, locale: "en" as const, ...NO_CHANGE }

        await expect(w.projects().update({ ...change, deployedUrl: "https://127.0.0.1.nip.io" })).rejects.toMatchObject(
            {
                code: "PROJECT_TARGET_REFUSED",
            },
        )
        const saved = await w.projects().update({ ...change, deployedUrl: "https://app.example.com/" })

        expect(saved.deployedUrl).toBe("https://app.example.com")
    })

    it("deletes a project with everything on it and then does not find it", async () => {
        const learnerId = ids.next()
        const { project } = await w.projects().create({ learnerId, ...CREATE })

        await expect(w.projects().remove(learnerId, project.id)).resolves.toEqual({ id: project.id })

        await expect(w.reads().get({ learnerId, projectId: project.id, locale: "en" })).rejects.toMatchObject({
            code: "PROJECT_NOT_FOUND",
        })
        expect(await w.reads().list({ learnerId, locale: "en" })).toEqual([])
    })
})
