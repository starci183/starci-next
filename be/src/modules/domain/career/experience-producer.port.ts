import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { ExperienceItemView, ProduceExperienceParams } from "./career.contracts"

/**
 * The producer port of the experience engine: every learning shard that proves evidence (Essentials today; Projects, agent projects
 * and Incidents once they exist) hands it here, and the engine creates or regrades the catalog item. A producer passes only StarCi
 * evidence and the slot values read from it, never a value the learner typed.
 */
export interface ExperienceProducer {
    /** Creates or regrades the item of the evidence and answers it. */
    produce(params: ProduceExperienceParams): Promise<ExperienceItemView>
}

/** Token of the experience producer. */
export const EXPERIENCE_PRODUCER: unique symbol = Symbol("domain.career.experience-producer")

/** Injects the experience producer. Parameter type: ExperienceProducer. */
export const InjectExperienceProducer = (): TypedParameterDecorator<ExperienceProducer> =>
    injector<ExperienceProducer>(EXPERIENCE_PRODUCER)
