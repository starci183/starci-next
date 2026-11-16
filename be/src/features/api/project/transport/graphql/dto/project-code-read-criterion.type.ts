import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One rubric criterion of an AI code read with the teacher's verdict. */
export class ProjectCodeReadCriterionType {
    /** The criterion id. */
    @Field(() => String)
    criterionId!: string

    /** The criterion as the learner reads it. */
    @Field(() => String)
    criterion!: string

    /** The level 0, 1 or 2. */
    @Field(() => Int)
    level!: number

    /** missing, partial or met. */
    @Field(() => String)
    verdict!: string

    /** The words of the learner's own text the level rests on; empty at level 0. */
    @Field(() => String)
    evidenceQuote!: string
}
