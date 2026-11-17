import { Test } from "@nestjs/testing"
import { FIXTURE_CHECK_FILES } from "@tests/fixtures/builders/check-set.builder"
import type { CheckSetFiles } from "./project-check-set.contracts"
import { PROJECT_CHECK_SOURCE, type ProjectCheckSource } from "./project-check-set.port"
import { ProjectCheckSetService } from "./project-check-set.service"

const build = async (read: () => Promise<CheckSetFiles | null>) => {
    const source: ProjectCheckSource = { read }
    const moduleRef = await Test.createTestingModule({
        providers: [ProjectCheckSetService, { provide: PROJECT_CHECK_SOURCE, useValue: source }],
    }).compile()
    return moduleRef.get(ProjectCheckSetService)
}

describe("ProjectCheckSetService", () => {
    it("reads the check set once per content version and answers lookups from it", async () => {
        const read = jest.fn(() => Promise.resolve(FIXTURE_CHECK_FILES))
        const service = await build(read)

        const first = await service.current()
        const second = await service.current()

        expect(second).toBe(first)
        expect((await service.milestonesOfKind("agent")).map((milestone) => milestone.id)).toEqual([
            "bf-http-foundation",
            "agent-mindset",
            "agent-theory",
        ])
        expect((await service.conceptOf("rate-limiting"))?.probes).toEqual(["burst"])
        expect(await service.conceptOf("nope")).toBeNull()
    })

    it("reads again when the source answers a new version", async () => {
        let version = "v1"
        const service = await build(() => Promise.resolve({ ...FIXTURE_CHECK_FILES, version }))

        const first = await service.current()
        version = "v2"
        const second = await service.current()

        expect(second).not.toBe(first)
        expect(second.version).toBe("v2")
    })

    it("is unavailable without content", async () => {
        const service = await build(() => Promise.resolve(null))

        await expect(service.current()).rejects.toMatchObject({ code: "PROJECT_CHECKS_UNAVAILABLE" })
    })

    it("refuses a whole set whose concept is easier to prove than the model allows", async () => {
        const easy = FIXTURE_CHECK_FILES.catalog.replace(
            "    requires: [[test, e2e], [probe]]\n    probes: [burst]",
            "    requires: [[test, e2e]]\n    probes: [burst]",
        )
        expect(easy).not.toBe(FIXTURE_CHECK_FILES.catalog)
        const service = await build(() => Promise.resolve({ ...FIXTURE_CHECK_FILES, version: "easy", catalog: easy }))

        await expect(service.current()).rejects.toMatchObject({ code: "PROJECT_CHECKS_UNAVAILABLE" })
    })
})
