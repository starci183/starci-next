import {
    toProblemItemWires,
    toProblemWire,
    toSubmissionWire,
    type PracticeHintText,
    type PracticePatternView,
    type PracticeProblemItemView,
    type PracticeProblemView,
    type PracticeReadinessView,
    type PracticeSubmissionView,
} from "@modules/domain/practice"
import type { PracticeHintType } from "./dto/practice-hint.type"
import type { PracticePatternType } from "./dto/practice-pattern.type"
import type { PracticeProblemItemType } from "./dto/practice-problem-item.type"
import type { PracticeProblemType } from "./dto/practice-problem.type"
import type { PracticeReadinessItemType } from "./dto/practice-readiness-item.type"
import type { PracticeSubmissionType } from "./dto/practice-submission.type"

/** Maps the patterns to their GraphQL type. */
export const toPracticePatternTypes = (views: ReadonlyArray<PracticePatternView>): Array<PracticePatternType> => [
    ...views,
]

/** Maps the problems of a pattern to their GraphQL type. */
export const toPracticeProblemItemTypes = (
    views: ReadonlyArray<PracticeProblemItemView>,
): Array<PracticeProblemItemType> => toProblemItemWires(views)

/** Maps one problem to its GraphQL type: the view holds no test and no solution, so none can be mapped. */
export const toPracticeProblemType = (view: PracticeProblemView): PracticeProblemType => toProblemWire(view)

/** Maps one submission to its GraphQL type. */
export const toPracticeSubmissionType = (view: PracticeSubmissionView): PracticeSubmissionType => toSubmissionWire(view)

/** Maps the readiness per pattern to its GraphQL type. */
export const toPracticeReadinessItemTypes = (
    views: ReadonlyArray<PracticeReadinessView>,
): Array<PracticeReadinessItemType> => [...views]

/** Maps one hint step to its GraphQL type. */
export const toPracticeHintType = (view: PracticeHintText): PracticeHintType => ({ ...view })
