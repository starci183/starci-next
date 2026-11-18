import { CommandHandler } from "@nestjs/cqrs"
import { AttemptMarkService } from "@modules/domain/attempt"
import { LessonError, LessonErrorCode, LessonReadService } from "@modules/domain/lesson"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import type { LessonHintRevealed } from "./reveal-lesson-hint.contracts"
import { RevealLessonHintCommand } from "./reveal-lesson-hint.command"

@CommandHandler(RevealLessonHintCommand)
/**
 * Gives the hint of one scenario to a learner who asks for it before a red run, and records that they used it (the lesson then reads
 * "có hỗ trợ"). Asking again returns the same hint and records nothing new. Kịch bản must be readable by the learner.
 */
export class RevealLessonHintHandler extends ICQRSHandler<RevealLessonHintCommand, LessonHintRevealed> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly lessons: LessonReadService,
        private readonly marks: AttemptMarkService,
    ) {
        super(logger)
    }

    protected override async process(command: RevealLessonHintCommand): Promise<LessonHintRevealed> {
        const learnerId = command.params.principal.id
        const { lessonId, scenarioId, locale } = command.params.request
        const view = await this.lessons.find({ id: lessonId, locale, learnerId })
        if (view.essential?.lockedParts.includes("3-scenarios") === true)
            throw new LessonError({ code: LessonErrorCode.PremiumRequired })
        const hint = view.essential?.scenarios.find((scenario) => scenario.id === scenarioId)?.hint ?? null
        if (hint === null) throw new LessonError({ code: LessonErrorCode.NotFound })
        await this.marks.useHint(learnerId, lessonId, scenarioId)
        return { scenarioId, hint }
    }
}
