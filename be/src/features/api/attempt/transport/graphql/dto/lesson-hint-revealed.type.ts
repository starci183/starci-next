import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The hint of one scenario once the learner unlocked it. */
export class LessonHintRevealedType {
    /** The scenario. */
    @Field(() => String)
    scenarioId!: string

    /** The hint text. */
    @Field(() => String)
    hint!: string
}
