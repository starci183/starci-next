import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A deleted project. */
export class ProjectDeletedType {
    /** The id of the project that was deleted. */
    @Field(() => String)
    id!: string
}
