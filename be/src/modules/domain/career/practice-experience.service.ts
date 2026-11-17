import { Injectable } from "@nestjs/common"
import { InjectClock, type Clock } from "@modules/platform/clock"
import type { ClaimPracticeExperienceParams, ExperienceItemView } from "./career.contracts"
import { CareerError } from "./errors/career.error"
import { InjectExperiencePractice, type ExperiencePracticeSource } from "./experience-practice.port"
import { InjectExperienceProducer, type ExperienceProducer } from "./experience-producer.port"
import { practiceExperienceOf, practiceRefusalOf } from "./practice-evidence.policy"

@Injectable()
/**
 * The practice producer: a learner claims the experience of one pattern, which the engine grants only when every problem of the
 * pattern is accepted and none had its solution revealed before its first Accepted. It reads practice through the port and hands
 * the experience engine the item; a pattern that does not meet the rule is refused with a code that names why.
 */
export class PracticeExperienceService {
    constructor(
        @InjectClock() private readonly clock: Clock,
        @InjectExperienceProducer() private readonly producer: ExperienceProducer,
        @InjectExperiencePractice() private readonly practice: ExperiencePracticeSource,
    ) {}

    /** Creates or regrades the item of a pattern; refused CAREER_PRACTICE_INCOMPLETE or CAREER_PRACTICE_SOLUTION_VIEWED. */
    async claim(params: ClaimPracticeExperienceParams): Promise<ExperienceItemView> {
        const lookup = { learnerId: params.learnerId, patternId: params.patternId }
        const [vi, en] = await Promise.all([
            this.practice.completion({ ...lookup, locale: "vi" }),
            this.practice.completion({ ...lookup, locale: "en" }),
        ])
        const refusal = practiceRefusalOf(vi)
        if (refusal !== null) throw new CareerError({ code: refusal })
        return this.producer.produce(practiceExperienceOf(params.learnerId, vi, en, this.clock.now().toISOString()))
    }
}
