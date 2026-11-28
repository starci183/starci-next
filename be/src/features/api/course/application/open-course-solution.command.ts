import { Command } from "@nestjs/cqrs"
import type { CourseSolutionOpened } from "@modules/domain/course"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { OpenCourseSolutionRequest } from "./course.contracts"

/** Records that the signed-in learner opened the solution of one case ("Kẹt quá? Xem lời giải"). */
export class OpenCourseSolutionCommand extends Command<CourseSolutionOpened> {
    constructor(readonly params: ExecuteParams<OpenCourseSolutionRequest>) {
        super()
    }
}
