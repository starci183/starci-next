import { CommandHandler } from "@nestjs/cqrs"
import { AttemptMarkService } from "@modules/domain/attempt"
import { LessonContentService, LessonError, LessonErrorCode } from "@modules/domain/lesson"
import {
    bugHintKeyOf,
    bugResultsOf,
    nextBugHintOf,
    RelayLessonService,
    type LessonBugResult,
} from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { OpenLessonBugHintCommand } from "./open-lesson-bug-hint.command"
import { lessonBugFactsOf } from "./get-lesson-bug-results.handler"

@CommandHandler(OpenLessonBugHintCommand)
/**
 * Opens the next hint of one Tìm sạn test, one at a time and only while its newest run is red, and records it (the page then
 * shows how many hints the learner used; opening one costs no points). A test that is not red, or has no hint left, answers its
 * result unchanged.
 */
export class OpenLessonBugHintHandler extends ICQRSHandler<OpenLessonBugHintCommand, LessonBugResult> {
    constructor(
        @InjectLogger() logger: Logger,
        readonly content: LessonContentService,
        readonly runs: RelayLessonService,
        readonly marks: AttemptMarkService,
    ) {
        super(logger)
    }

    protected override async process(command: OpenLessonBugHintCommand): Promise<LessonBugResult> {
        const learnerId = command.params.principal.id
        const { lessonId, testId } = command.params.request
        const facts = await lessonBugFactsOf(this, learnerId, command.params.request)
        const next = nextBugHintOf(facts.pack, testId, facts.runs, facts.hintKeys)
        if (next.kind === "unknown") throw new LessonError({ code: LessonErrorCode.NotFound })
        const keys = new Set(facts.hintKeys)
        if (next.kind === "open") {
            const key = bugHintKeyOf(testId, next.level)
            await this.marks.useHint(learnerId, lessonId, key)
            keys.add(key)
        }
        const result = bugResultsOf(facts.pack, facts.runs, keys).find((each) => each.testId === testId)
        if (result === undefined) throw new LessonError({ code: LessonErrorCode.NotFound })
        return result
    }
}
