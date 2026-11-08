import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { AGENT_LAB_OPTIONS } from "./agent-lab.decorators"
import type { AgentLabOptions } from "./agent-lab.options"
import { AgentLabReadService } from "./agent-lab-read.service"

const LEARNER = "11111111-1111-4111-8111-111111111111"

const build = async (premium: boolean, options: AgentLabOptions = {}) => {
    const settings: AgentLabOptions = { ...options }
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(premium)
    const moduleRef = await Test.createTestingModule({
        providers: [
            AgentLabReadService,
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: AGENT_LAB_OPTIONS, useValue: settings },
        ],
    }).compile()
    return { service: moduleRef.get(AgentLabReadService), entitlement }
}

describe("AgentLabReadService", () => {
    it("lists the three tracks and the seven concepts, with no lab written yet", async () => {
        const { service } = await build(false)

        const overview = await service.overview({ learnerId: LEARNER, locale: "vi" })

        expect(overview.tracks.map((track) => [track.id, track.labCount, track.pinnedVersion])).toEqual([
            ["claude", 0, null],
            ["openclaw", 0, null],
            ["hermes", 0, null],
        ])
        expect(overview.concepts).toHaveLength(7)
    })

    it("reads the pin the app names for a track", async () => {
        const { service } = await build(false, { pinnedVersions: { hermes: "0.4.0" } })

        const track = await service.track({ learnerId: LEARNER, locale: "en", trackId: "hermes" })

        expect(track.pinnedVersion).toBe("0.4.0")
        expect(track.cells).toHaveLength(7)
    })

    it("answers AGENT_LAB_TRACK_NOT_FOUND for an unknown track", async () => {
        const { service } = await build(false)

        await expect(service.track({ learnerId: LEARNER, locale: "vi", trackId: "orca" })).rejects.toMatchObject({
            code: "AGENT_LAB_TRACK_NOT_FOUND",
        })
    })

    it("opens the labs of later concepts for a Premium learner", async () => {
        const { service, entitlement } = await build(true, {
            labs: [
                {
                    labId: "lab-context",
                    trackId: "claude",
                    conceptId: "context",
                    status: "approved",
                    title: { vi: "vi", en: "en" },
                    steps: [],
                },
            ],
        })

        const track = await service.track({ learnerId: LEARNER, locale: "vi", trackId: "claude" })

        expect(entitlement.isPremium).toHaveBeenCalledWith(LEARNER)
        expect(track.cells[1]).toMatchObject({ locked: false, open: true })
    })
})
