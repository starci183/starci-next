import { CommandHandler } from "@nestjs/cqrs"
import { AttemptMarkService } from "@modules/domain/attempt"
import { LessonError, LessonErrorCode, LessonReadService } from "@modules/domain/lesson"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { MarkLessonSectionReadCommand } from "./mark-lesson-section-read.command"

@CommandHandler(MarkLessonSectionReadCommand)
/** Records that the learner read a section they may read; marking again changes nothing. A locked or unknown section is refused. */
export class MarkLessonSectionReadHandler extends ICQRSHandler<MarkLessonSectionReadCommand, ReadonlyArray<string>> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly lessons: LessonReadService,
        private readonly marks: AttemptMarkService,
    ) {
        super(logger)
    }

    protected override async process(command: MarkLessonSectionReadCommand): Promise<ReadonlyArray<string>> {
        const learnerId = command.params.principal.id
        const { lessonId, sectionId } = command.params.request
        const view = await this.lessons.find({ id: lessonId, locale: "vi", learnerId })
        const section = view.sections.find((each) => each.id === sectionId)
        if (section === undefined) throw new LessonError({ code: LessonErrorCode.NotFound })
        if (section.locked) throw new LessonError({ code: LessonErrorCode.PremiumRequired })
        await this.marks.markSectionRead(learnerId, lessonId, sectionId)
        return this.marks.readSectionIds(learnerId, lessonId)
    }
}
