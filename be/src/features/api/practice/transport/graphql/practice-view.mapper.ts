import {
    toNextWire,
    toProblemItemWires,
    toProblemWire,
    toSolutionWire,
    toSubmissionWire,
    type PracticeHintText,
    type PracticeNextView,
    type PracticePatternView,
    type PracticeProblemItemView,
    type PracticeProblemView,
    type PracticeReadinessView,
    type PracticeSolutionView,
    type PracticeSubmissionView,
} from "@modules/domain/practice"
import type { PracticeHintType } from "./dto/practice-hint.type"
import type { PracticeNextType } from "./dto/practice-next.type"
import type { PracticePatternType } from "./dto/practice-pattern.type"
import type { PracticeProblemItemType } from "./dto/practice-problem-item.type"
import type { PracticeProblemType } from "./dto/practice-problem.type"
import type { PracticeReadinessItemType } from "./dto/practice-readiness-item.type"
import type { PracticeSolutionType } from "./dto/practice-solution.type"
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

/** Maps the next and the resume problem to their GraphQL type. */
export const toPracticeNextType = (view: PracticeNextView): PracticeNextType => toNextWire(view)

/** Maps one revealed solution to its GraphQL type. */
export const toPracticeSolutionType = (view: PracticeSolutionView): PracticeSolutionType => toSolutionWire(view)
