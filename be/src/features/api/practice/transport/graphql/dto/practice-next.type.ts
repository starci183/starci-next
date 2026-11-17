import { Field, ObjectType } from "@nestjs/graphql"
import { PracticeNextProblemType } from "./practice-next-problem.type"
import { PracticeResumeProblemType } from "./practice-resume-problem.type"

@ObjectType()
/** Where to go next in practice. */
export class PracticeNextType {
    /** The first problem not yet accepted in the recommended order, or null when every problem is accepted. */
    @Field(() => PracticeNextProblemType, { nullable: true })
    next!: PracticeNextProblemType | null

    /** The problem most recently submitted and not accepted, or null. */
    @Field(() => PracticeResumeProblemType, { nullable: true })
    resume!: PracticeResumeProblemType | null
}
