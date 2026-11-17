import { Command } from "@nestjs/cqrs"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { MarkLessonSectionReadRequest } from "./mark-lesson-section-read.contracts"

/** Marks one article section as read for the signed-in learner and answers every section they marked in the lesson. */
export class MarkLessonSectionReadCommand extends Command<ReadonlyArray<string>> {
    constructor(readonly params: ExecuteParams<MarkLessonSectionReadRequest>) {
        super()
    }
}
