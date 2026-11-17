import { Field, ObjectType } from "@nestjs/graphql"
import { ProgressActivityType } from "./progress-activity.type"
import { ProgressEssentialsType } from "./progress-essentials.type"
import { ProgressHarnessType } from "./progress-harness.type"
import { ProgressPracticeType } from "./progress-practice.type"
import { ProgressProjectsType } from "./progress-projects.type"
import { ProgressReviewType } from "./progress-review.type"
import { ProgressRibbonType } from "./progress-ribbon.type"

@ObjectType()
/** Everything the progress page shows. */
export class LearnerProgressType {
    /** free or premium. */
    @Field(() => String)
    plan!: string

    /** The top ribbon. */
    @Field(() => ProgressRibbonType)
    ribbon!: ProgressRibbonType

    /** Essentials; null when its source failed. */
    @Field(() => ProgressEssentialsType, { nullable: true })
    essentials!: ProgressEssentialsType | null

    /** Harness; null when its source failed. */
    @Field(() => ProgressHarnessType, { nullable: true })
    harness!: ProgressHarnessType | null

    /** Projects; null for a learner without a subscription or when its source failed. */
    @Field(() => ProgressProjectsType, { nullable: true })
    projects!: ProgressProjectsType | null

    /** Whether Projects is closed to the plan. */
    @Field(() => Boolean)
    projectsLocked!: boolean

    /** Review and streak; null when both failed. */
    @Field(() => ProgressReviewType, { nullable: true })
    review!: ProgressReviewType | null

    /** Practice; null when its source failed. */
    @Field(() => ProgressPracticeType, { nullable: true })
    practice!: ProgressPracticeType | null

    /** The newest lines first. */
    @Field(() => [ProgressActivityType])
    activity!: Array<ProgressActivityType>

    /** The sources that could not be read. */
    @Field(() => [String])
    unavailable!: Array<string>
}
