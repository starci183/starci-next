import { Command } from "@nestjs/cqrs"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { LessonHintRevealed, RevealLessonHintRequest } from "./reveal-lesson-hint.contracts"

/** Unlocks the hint of one scenario for the signed-in learner and records that they used it. */
export class RevealLessonHintCommand extends Command<LessonHintRevealed> {
    constructor(readonly params: ExecuteParams<RevealLessonHintRequest>) {
        super()
    }
}
