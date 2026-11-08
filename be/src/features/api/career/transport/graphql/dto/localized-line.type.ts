import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A line in both locales. */
export class LocalizedLineType {
    /** The Vietnamese line. */
    @Field(() => String)
    vi!: string

    /** The English line. */
    @Field(() => String)
    en!: string
}
