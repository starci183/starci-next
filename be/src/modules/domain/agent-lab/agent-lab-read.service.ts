import { Injectable } from "@nestjs/common"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { InjectAgentLabOptions } from "./agent-lab.decorators"
import type {
    AgentLabLocale,
    AgentLabOverviewView,
    AgentLabTrackDefinition,
    AgentLabTrackView,
} from "./agent-lab.contracts"
import type { AgentLabOptions } from "./agent-lab.options"
import { AgentLabError, AgentLabErrorCode } from "./errors/agent-lab.error"
import { AGENT_LAB_TRACKS, findAgentLabTrack } from "./agent-lab-catalog.policy"
import { toConceptViews, toTrackSummary, toTrackView, type AgentLabTrackSource } from "./agent-lab-view.mapper"

/** Who asks, in which locale. */
export interface AgentLabReadParams {
    /** The learner. */
    readonly learnerId: string
    /** The locale of the copy. */
    readonly locale: AgentLabLocale
}

/** Which track, for whom. */
export interface AgentLabTrackParams extends AgentLabReadParams {
    /** The track id. */
    readonly trackId: string
}

@Injectable()
/** Serves the agent lab pages: the overview of tracks and mindset concepts, and one track with the grid of its labs. */
export class AgentLabReadService {
    constructor(
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @InjectAgentLabOptions() private readonly options: AgentLabOptions,
    ) {}

    /** The tracks and the seven mindset concepts, with how many labs each track has and the learner can open. */
    async overview(params: AgentLabReadParams): Promise<AgentLabOverviewView> {
        const premium = await this.entitlement.isPremium(params.learnerId)
        return {
            tracks: AGENT_LAB_TRACKS.map((track) => toTrackSummary(this.sourceOf(track, params.locale, premium))),
            concepts: toConceptViews(params.locale),
        }
    }

    /** One track with a cell per concept; an unknown track is AGENT_LAB_TRACK_NOT_FOUND. */
    async track(params: AgentLabTrackParams): Promise<AgentLabTrackView> {
        const track = findAgentLabTrack(params.trackId)
        if (track === undefined) throw new AgentLabError({ code: AgentLabErrorCode.TrackNotFound })
        return toTrackView(this.sourceOf(track, params.locale, await this.entitlement.isPremium(params.learnerId)))
    }

    private sourceOf(track: AgentLabTrackDefinition, locale: AgentLabLocale, premium: boolean): AgentLabTrackSource {
        return {
            track,
            labs: this.options.labs ?? [],
            pinnedVersion: this.options.pinnedVersions?.[track.id],
            locale,
            premium,
        }
    }
}
