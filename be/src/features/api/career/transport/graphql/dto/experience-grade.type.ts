import { Field, ObjectType } from "@nestjs/graphql"
import { CriterionGradeType } from "./criterion-grade.type"

@ObjectType()
/** The grade the grader gave the evidence of an item. */
export class ExperienceGradeType {
    /** pass or fail. */
    @Field(() => String)
    result!: string

    /** The grade of each criterion. */
    @Field(() => [CriterionGradeType])
    criteria!: ReadonlyArray<CriterionGradeType>
}
