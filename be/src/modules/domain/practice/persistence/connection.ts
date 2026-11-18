import { PracticeHintRevealEntity } from "./entities/practice-hint-reveal.entity"
import { PracticePatternIntroEntity } from "./entities/practice-pattern-intro.entity"
import { PracticeProblemVersionEntity } from "./entities/practice-problem-version.entity"
import { PracticeSolutionRevealEntity } from "./entities/practice-solution-reveal.entity"
import { PracticeSubmissionEntity } from "./entities/practice-submission.entity"
import { InitPractice1796500000000 } from "./migrations/1796500000000-init-practice"
import { PracticeSolutionsAndIntros1798800000000 } from "./migrations/1798800000000-practice-solutions-and-intros"
import { PracticeSubmissionHistoryIndex1798800000003 } from "./migrations/1798800000003-practice-submission-history-index"

/** The entities of the practice capability. */
export const practiceEntities: Array<
    | typeof PracticeProblemVersionEntity
    | typeof PracticeSubmissionEntity
    | typeof PracticeHintRevealEntity
    | typeof PracticeSolutionRevealEntity
    | typeof PracticePatternIntroEntity
> = [
    PracticeProblemVersionEntity,
    PracticeSubmissionEntity,
    PracticeHintRevealEntity,
    PracticeSolutionRevealEntity,
    PracticePatternIntroEntity,
]

/** The migrations of the practice capability, in the order they run. */
export const practiceMigrations: Array<
    | typeof InitPractice1796500000000
    | typeof PracticeSolutionsAndIntros1798800000000
    | typeof PracticeSubmissionHistoryIndex1798800000003
> = [InitPractice1796500000000, PracticeSolutionsAndIntros1798800000000, PracticeSubmissionHistoryIndex1798800000003]
