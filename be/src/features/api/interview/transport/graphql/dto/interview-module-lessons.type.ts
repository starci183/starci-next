import { Field, ObjectType } from "@nestjs/graphql"
import { InterviewLessonLinkType } from "./interview-lesson-link.type"

@ObjectType()
/** The lessons of one module slug. */
export class InterviewModuleLessonsType {
    /** The module slug. */
    @Field(() => String)
    moduleRef!: string

    /** Its live lessons. */
    @Field(() => [InterviewLessonLinkType])
    lessons!: ReadonlyArray<InterviewLessonLinkType>
}
