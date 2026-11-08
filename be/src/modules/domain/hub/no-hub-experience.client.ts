import { Injectable } from "@nestjs/common"
import type { HubExperiencePort } from "./hub-experience.port"
import type { HubExperienceCounts } from "./hub.contracts"

@Injectable()
/** The experience port of an app that binds none: the hub shows no experience counts. */
export class NoHubExperienceClient implements HubExperiencePort {
    /** Answers with no counts, as no experience read exists. */
    counts(): Promise<HubExperienceCounts> {
        return Promise.resolve({})
    }
}
