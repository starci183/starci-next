import { Command } from "@nestjs/cqrs"
import type { CourseHintOpened } from "@modules/domain/course"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { OpenCourseHintRequest } from "./course.contracts"

/** Opens one hint level of one case for the signed-in learner. */
export class OpenCourseHintCommand extends Command<CourseHintOpened> {
    constructor(readonly params: ExecuteParams<OpenCourseHintRequest>) {
        super()
    }
}
