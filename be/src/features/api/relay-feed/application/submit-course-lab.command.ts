import { Command } from "@nestjs/cqrs"
import type { CourseLabSubmitted } from "@modules/domain/relay"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SubmitCourseLabRequest } from "./course-lab.contracts"

/** Submits the lab for grading on the signed-in learner's online device. */
export class SubmitCourseLabCommand extends Command<CourseLabSubmitted> {
    constructor(readonly params: ExecuteParams<SubmitCourseLabRequest>) {
        super()
    }
}
