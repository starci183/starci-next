import type {
    AgentLabCellView,
    AgentLabConceptView,
    AgentLabDefinition,
    AgentLabLocale,
    AgentLabTrackDefinition,
    AgentLabTrackSummaryView,
    AgentLabTrackView,
} from "./agent-lab.contracts"
import { AGENT_LAB_CONCEPTS, isConceptFree, labsOfTrack } from "./agent-lab-catalog.policy"

/** What a track view is built from. */
export interface AgentLabTrackSource {
    /** The track. */
    readonly track: AgentLabTrackDefinition
    /** The labs the teacher wrote, of every track. */
    readonly labs: ReadonlyArray<AgentLabDefinition>
    /** The tool version the track's labs are pinned to, or undefined before the pin. */
    readonly pinnedVersion: string | undefined
    /** The asked locale. */
    readonly locale: AgentLabLocale
    /** Whether the learner holds Premium. */
    readonly premium: boolean
}

/** Maps the mindset concepts to the asked locale; the first concept is the free one. */
export const toConceptViews = (locale: AgentLabLocale): ReadonlyArray<AgentLabConceptView> =>
    AGENT_LAB_CONCEPTS.map((concept, position) => ({
        id: concept.id,
        label: concept.label[locale],
        evidence: concept.evidence[locale],
        free: isConceptFree(position),
    }))

/**
 * Maps one concept of a track to its cell. A concept without a written lab is `being-written` with no title and no steps; the
 * steps of a lab are shown only when the lab is approved and the learner may open it, so a draft never leaks.
 */
const toCell = (
    source: AgentLabTrackSource,
    concept: (typeof AGENT_LAB_CONCEPTS)[number],
    position: number,
    lab: AgentLabDefinition | undefined,
): AgentLabCellView => {
    const locked = !isConceptFree(position) && !source.premium
    const open = lab?.status === "approved" && !locked
    return {
        conceptId: concept.id,
        conceptLabel: concept.label[source.locale],
        labId: lab?.labId ?? null,
        status: lab?.status ?? "being-written",
        title: lab?.title[source.locale] ?? null,
        locked,
        open,
        steps: open ? lab.steps.map((step) => ({ text: step.text[source.locale], sourceUrl: step.sourceUrl })) : [],
    }
}

/** Maps a track to its summary: the labels, who pays, the pin and how many labs exist and open. */
export const toTrackSummary = (source: AgentLabTrackSource): AgentLabTrackSummaryView => {
    const cells = toCells(source)
    return {
        id: source.track.id,
        label: source.track.label[source.locale],
        focus: source.track.focus[source.locale],
        keyMode: source.track.keyMode,
        pinnedVersion: source.pinnedVersion ?? null,
        labCount: cells.filter((cell) => cell.labId !== null).length,
        openLabCount: cells.filter((cell) => cell.open).length,
    }
}

const toCells = (source: AgentLabTrackSource): ReadonlyArray<AgentLabCellView> => {
    const labs = labsOfTrack(source.labs, source.track.id)
    return AGENT_LAB_CONCEPTS.map((concept, position) =>
        toCell(
            source,
            concept,
            position,
            labs.find((lab) => lab.conceptId === concept.id),
        ),
    )
}

/** Maps a track to its page: the summary and one cell per concept. */
export const toTrackView = (source: AgentLabTrackSource): AgentLabTrackView => ({
    ...toTrackSummary(source),
    cells: toCells(source),
})
