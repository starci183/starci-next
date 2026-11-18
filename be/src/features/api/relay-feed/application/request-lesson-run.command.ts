import { Command } from "@nestjs/cqrs"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { LessonRunRequested, RequestLessonRunRequest } from "./request-lesson-run.contracts"

/** Asks the signed-in learner's online device to run one scenario of a lesson. */
export class RequestLessonRunCommand extends Command<LessonRunRequested> {
    constructor(readonly params: ExecuteParams<RequestLessonRunRequest>) {
        super()
    }
}
