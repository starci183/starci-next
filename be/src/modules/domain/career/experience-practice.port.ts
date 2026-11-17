import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { PracticePatternEvidence } from "./career.contracts"

/** What the experience engine asks the practice capability for one pattern of one learner in one locale. */
export interface ExperiencePracticeLookup {
    /** The learner. */
    readonly learnerId: string
    /** The pattern id. */
    readonly patternId: string
    /** The locale of the pattern title. */
    readonly locale: "vi" | "en"
}

/**
 * The port through which the experience engine reads practice: the shape of `PracticeReadService.completion`. The app binds it
 * with `CareerModule.register({ practice: PracticeReadService })`; until then `EmptyPracticeClient` answers a pattern with no
 * problems, so no item is claimed.
 */
export interface ExperiencePracticeSource {
    /** What the learner has accepted in the pattern and whether a solution was revealed first. */
    completion(lookup: ExperiencePracticeLookup): Promise<PracticePatternEvidence>
}

/** Token of the practice source of the experience engine. */
export const EXPERIENCE_PRACTICE: unique symbol = Symbol("domain.career.experience-practice")

/** Injects the practice source. Parameter type: ExperiencePracticeSource. */
export const InjectExperiencePractice = (): TypedParameterDecorator<ExperiencePracticeSource> =>
    injector<ExperiencePracticeSource>(EXPERIENCE_PRACTICE)
