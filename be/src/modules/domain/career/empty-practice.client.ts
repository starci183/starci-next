import { Injectable } from "@nestjs/common"
import type { PracticePatternEvidence } from "./career.contracts"
import type { ExperiencePracticeLookup, ExperiencePracticeSource } from "./experience-practice.port"

@Injectable()
/** The practice source bound while the app names none: every pattern has no problem, so no practice item is ever claimed. */
export class EmptyPracticeClient implements ExperiencePracticeSource {
    /** Answers a pattern with no problems. */
    completion(lookup: ExperiencePracticeLookup): Promise<PracticePatternEvidence> {
        return Promise.resolve({
            patternId: lookup.patternId,
            title: lookup.patternId,
            problemCount: 0,
            acceptedCount: 0,
            viewedCount: 0,
            language: null,
        })
    }
}
