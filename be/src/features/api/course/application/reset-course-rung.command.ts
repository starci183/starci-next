import { Command } from "@nestjs/cqrs"
import type { CourseRungFile } from "@modules/domain/course"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { ResetCourseRungRequest } from "./course-rung.contracts"

/** Records a learner's reset of a case and answers the case's own rung (`rung:<tag>`, one file). */
export class ResetCourseRungCommand extends Command<CourseRungFile> {
    constructor(readonly params: PublicExecuteParams<ResetCourseRungRequest>) {
        super()
    }
}
