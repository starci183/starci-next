import { Field, ObjectType } from "@nestjs/graphql"
import { ProjectCvEvidenceLinkType } from "./project-cv-evidence-link.type"

@ObjectType()
/** The CV line a proved concept or milestone would give, shown before anything is produced. */
export class ProjectCvPreviewType {
    /** The project id. */
    @Field(() => String)
    projectId!: string

    /** concept or milestone. */
    @Field(() => String)
    subjectKind!: string

    /** The concept or milestone id. */
    @Field(() => String)
    subjectId!: string

    /** Whether it is proved now; a line shown for one that is not is a draft and never reaches the CV. */
    @Field(() => Boolean)
    proved!: boolean

    /** The line in the asked locale, or null when the evidence leaves a slot empty. */
    @Field(() => String, { nullable: true })
    text!: string | null

    /** The proof the line stands on. */
    @Field(() => [ProjectCvEvidenceLinkType])
    evidence!: ReadonlyArray<ProjectCvEvidenceLinkType>
}
