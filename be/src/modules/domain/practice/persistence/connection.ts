import { PracticeHintRevealEntity } from "./entities/practice-hint-reveal.entity"
import { PracticeProblemVersionEntity } from "./entities/practice-problem-version.entity"
import { PracticeSubmissionEntity } from "./entities/practice-submission.entity"
import { InitPractice1796500000000 } from "./migrations/1796500000000-init-practice"

/** The entities of the practice capability. */
export const practiceEntities: Array<
    typeof PracticeProblemVersionEntity | typeof PracticeSubmissionEntity | typeof PracticeHintRevealEntity
> = [PracticeProblemVersionEntity, PracticeSubmissionEntity, PracticeHintRevealEntity]

/** The migrations of the practice capability, in the order they run. */
export const practiceMigrations: Array<typeof InitPractice1796500000000> = [InitPractice1796500000000]
