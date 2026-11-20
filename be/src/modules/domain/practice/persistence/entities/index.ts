import { PracticeProblemVersionEntity } from "./practice-problem-version.entity"
import { PracticeSubmissionEntity } from "./practice-submission.entity"
import { PracticeHintRevealEntity } from "./practice-hint-reveal.entity"
import { PracticeSolutionRevealEntity } from "./practice-solution-reveal.entity"
import { PracticePatternIntroEntity } from "./practice-pattern-intro.entity"

export {
    PracticeHintRevealEntity,
    PracticePatternIntroEntity,
    PracticeProblemVersionEntity,
    PracticeSolutionRevealEntity,
    PracticeSubmissionEntity,
}

/** The entities of the practice capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const practiceEntities: ReadonlyArray<new () => object> = [
    PracticeProblemVersionEntity,
    PracticeSubmissionEntity,
    PracticeHintRevealEntity,
    PracticeSolutionRevealEntity,
    PracticePatternIntroEntity,
]
