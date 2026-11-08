import { Field, ID, InputType } from "@nestjs/graphql"
import { ArrayMaxSize, IsArray, IsBoolean, IsOptional, IsUUID } from "class-validator"

@InputType()
/** The markNotificationsRead arguments: the ids to mark, or all; exactly one of the two. */
export class MarkNotificationsReadInput {
    /** The notifications to mark read, at most 100; only the caller's own match. */
    @Field(() => [ID], { nullable: true })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(100)
    @IsUUID("all", { each: true })
    ids: Array<string> | null = null

    /** True to mark every unread notification of the caller. */
    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    all: boolean | null = null
}
