import { Test } from "@nestjs/testing"
import type { AgentLabDefinition } from "./agent-lab.contracts"
import {
    AGENT_LAB_CONCEPTS,
    AGENT_LAB_TRACKS,
    findAgentLabTrack,
    isConceptFree,
    labsOfTrack,
} from "./agent-lab-catalog.policy"

const POLICY: unique symbol = Symbol("agent-lab.catalog-policy")

const build = async () => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => ({ findAgentLabTrack, isConceptFree, labsOfTrack }) }],
    }).compile()
    return moduleRef.get<{
        findAgentLabTrack: typeof findAgentLabTrack
        isConceptFree: typeof isConceptFree
        labsOfTrack: typeof labsOfTrack
    }>(POLICY)
}

const labOf = (trackId: AgentLabDefinition["trackId"], conceptId: string, labId: string): AgentLabDefinition => ({
    labId,
    trackId,
    conceptId,
    status: "approved",
    title: { vi: labId, en: labId },
    steps: [],
})

describe("agent lab catalog", () => {
    it("holds the seven mindset concepts of the curriculum in order", () => {
        expect(AGENT_LAB_CONCEPTS.map((concept) => concept.id)).toEqual([
            "task-spec",
            "context",
            "tools-permissions",
            "verify",
            "decompose",
            "cost-limits",
            "operate",
        ])
    })

    it("holds the three tracks, the Claude one on the own account of the learner", () => {
        expect(AGENT_LAB_TRACKS.map((track) => [track.id, track.keyMode])).toEqual([
            ["claude", "byo"],
            ["openclaw", "starci-proxy"],
            ["hermes", "starci-proxy"],
        ])
    })

    it("finds a track by id and not an unknown one", async () => {
        const policy = await build()

        expect(policy.findAgentLabTrack("hermes")?.id).toBe("hermes")
        expect(policy.findAgentLabTrack("orca")).toBeUndefined()
    })

    it("opens only the first concept without Premium", async () => {
        const policy = await build()

        expect([0, 1, 6].map((position) => policy.isConceptFree(position))).toEqual([true, false, false])
    })

    it("keeps one lab per concept for a track, the first written", async () => {
        const policy = await build()
        const labs = [
            labOf("claude", "context", "first"),
            labOf("claude", "context", "second"),
            labOf("hermes", "context", "other-track"),
        ]

        expect(policy.labsOfTrack(labs, "claude").map((lab) => lab.labId)).toEqual(["first"])
    })
})
