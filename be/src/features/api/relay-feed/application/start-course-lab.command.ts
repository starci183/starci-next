import { Command } from "@nestjs/cqrs"
import type { CourseLabRequested } from "@modules/domain/relay"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { CourseLabRequest } from "./course-lab.contracts"

/** Asks the signed-in learner's online device to boot the lab of a lesson. */
export class StartCourseLabCommand extends Command<CourseLabRequested> {
    constructor(readonly params: ExecuteParams<CourseLabRequest>) {
        super()
    }
}
