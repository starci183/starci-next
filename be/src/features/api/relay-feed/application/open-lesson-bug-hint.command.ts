import { Command } from "@nestjs/cqrs"
import type { LessonBugResult } from "@modules/domain/relay"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { OpenLessonBugHintRequest } from "./get-lesson-bug-results.contracts"

/** Opens the next hint of one red Tìm sạn test for the signed-in learner. */
export class OpenLessonBugHintCommand extends Command<LessonBugResult> {
    constructor(readonly params: ExecuteParams<OpenLessonBugHintRequest>) {
        super()
    }
}
