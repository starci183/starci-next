import { Test } from "@nestjs/testing"
import type { AgentLabDefinition, AgentLabTrackDefinition } from "./agent-lab.contracts"
import { AGENT_LAB_COPY } from "./messages/agent-lab.messages"
import { toConceptViews, toTrackSummary, toTrackView, type AgentLabTrackSource } from "./agent-lab-view.mapper"

const MAPPER: unique symbol = Symbol("agent-lab.view-mapper")

const build = async () => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: MAPPER, useFactory: () => ({ toConceptViews, toTrackSummary, toTrackView }) }],
    }).compile()
    return moduleRef.get<{
        toConceptViews: typeof toConceptViews
        toTrackSummary: typeof toTrackSummary
        toTrackView: typeof toTrackView
    }>(MAPPER)
}

const labOf = (conceptId: string, status: AgentLabDefinition["status"]): AgentLabDefinition => ({
    labId: `lab-${conceptId}`,
    trackId: "openclaw",
    conceptId,
    status,
    title: { vi: `vi ${conceptId}`, en: `en ${conceptId}` },
    steps: [{ text: { vi: "vi step", en: "en step" }, sourceUrl: "https://docs.example/step" }],
})

const OPENCLAW: AgentLabTrackDefinition = {
    id: "openclaw",
    label: { vi: "vi openclaw", en: "en openclaw" },
    focus: { vi: "vi focus", en: "en focus" },
    keyMode: "starci-proxy",
}

const sourceOf = (overrides: Partial<AgentLabTrackSource> = {}): AgentLabTrackSource => ({
    track: OPENCLAW,
    labs: [],
    pinnedVersion: undefined,
    locale: "vi",
    premium: false,
    ...overrides,
})

describe("agent lab view mapper", () => {
    it("names the concepts in the asked locale and marks the first as free", async () => {
        const mapper = await build()

        const concepts = mapper.toConceptViews("en")

        expect(concepts).toHaveLength(7)
        expect(concepts[0]).toMatchObject({ id: "task-spec", label: "Clear task spec", free: true })
        expect(concepts[1]?.free).toBe(false)
    })

    it("shows every cell as being written, with no title or steps, while no lab exists", async () => {
        const mapper = await build()

        const view = mapper.toTrackView(sourceOf())

        expect(view.pinnedVersion).toBeNull()
        expect(view.labCount).toBe(0)
        expect(view.cells).toHaveLength(7)
        expect(view.cells[0]).toEqual({
            conceptId: "task-spec",
            conceptLabel: AGENT_LAB_COPY.vi["concept.task-spec.label"],
            labId: null,
            status: "being-written",
            title: null,
            locked: false,
            open: false,
            steps: [],
        })
        expect(view.cells[1]?.locked).toBe(true)
    })

    it("opens an approved free lab with its steps and the pin", async () => {
        const mapper = await build()

        const view = mapper.toTrackView(
            sourceOf({ labs: [labOf("task-spec", "approved")], pinnedVersion: "1.2.3", locale: "en" }),
        )

        expect(view.pinnedVersion).toBe("1.2.3")
        expect(view.cells[0]).toMatchObject({ labId: "lab-task-spec", title: "en task-spec", open: true })
        expect(view.cells[0]?.steps).toEqual([{ text: "en step", sourceUrl: "https://docs.example/step" }])
    })

    it("keeps a draft and an outdated lab closed and hides their steps", async () => {
        const mapper = await build()

        const view = mapper.toTrackView(sourceOf({ labs: [labOf("task-spec", "draft"), labOf("context", "outdated")] }))

        expect(view.cells.slice(0, 2).map((cell) => [cell.status, cell.open, cell.steps.length])).toEqual([
            ["draft", false, 0],
            ["outdated", false, 0],
        ])
    })

    it("locks an approved lab of a later concept until the learner holds Premium", async () => {
        const mapper = await build()
        const labs = [labOf("context", "approved")]

        const free = mapper.toTrackView(sourceOf({ labs }))
        const premium = mapper.toTrackView(sourceOf({ labs, premium: true }))

        expect([free.cells[1]?.locked, free.cells[1]?.open]).toEqual([true, false])
        expect([premium.cells[1]?.locked, premium.cells[1]?.open]).toEqual([false, true])
    })

    it("counts the labs that exist and the ones the learner can open in the summary", async () => {
        const mapper = await build()

        const summary = mapper.toTrackSummary(
            sourceOf({
                labs: [labOf("task-spec", "approved"), labOf("context", "approved"), labOf("verify", "draft")],
            }),
        )

        expect(summary).toMatchObject({ id: "openclaw", keyMode: "starci-proxy", labCount: 3, openLabCount: 1 })
    })
})
