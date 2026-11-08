import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { HubExperienceCounts } from "./hub.contracts"

/** The port through which the hub reads the experience counts per shard; the app binds the capability that owns them. */
export interface HubExperiencePort {
    /** The verified and pending experience items of a learner per shard; empty while no experience read exists. */
    counts(learnerId: string): Promise<HubExperienceCounts>
}

/** Token of the experience port. */
export const HUB_EXPERIENCE: unique symbol = Symbol("domain.hub.experience")

/** Injects the experience port. Parameter type: HubExperiencePort. */
export const InjectHubExperience = (): TypedParameterDecorator<HubExperiencePort> =>
    injector<HubExperiencePort>(HUB_EXPERIENCE)
