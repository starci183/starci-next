import { Command } from "@nestjs/cqrs"
import type { CourseLabRequested } from "@modules/domain/relay"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SetCourseLabChaosRequest } from "./course-lab.contracts"

/** Asks the signed-in learner's online device to turn exactly these chaos switches on and run the tests again. */
export class SetCourseLabChaosCommand extends Command<CourseLabRequested> {
    constructor(readonly params: ExecuteParams<SetCourseLabChaosRequest>) {
        super()
    }
}
