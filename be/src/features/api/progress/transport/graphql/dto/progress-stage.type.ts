import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One stage of a harness build. */
export class ProgressStageType {
    /** The stage id. */
    @Field(() => String)
    stageId!: string

    /** The title. */
    @Field(() => String)
    title!: string

    /** none, practising or proved. */
    @Field(() => String)
    state!: string
}
