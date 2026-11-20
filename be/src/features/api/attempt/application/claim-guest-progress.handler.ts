import { CommandHandler } from "@nestjs/cqrs"
import { AttemptGuestService, AttemptMarkService } from "@modules/domain/attempt"
import { LessonError, LessonReadService } from "@modules/domain/lesson"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ClaimGuestProgressCommand } from "./claim-guest-progress.command"
import type { ClaimGuestProgressResult } from "./claim-guest-progress.contracts"

@CommandHandler(ClaimGuestProgressCommand)
/**
 * Merges the answers and the read sections a guest kept on the device into the learner who just signed in. Answers are graded again by the
 * attempt capability and an activity the learner already answered is left alone; a section is marked only when the learner may read it.
 * Running it twice changes nothing the second time.
 */
export class ClaimGuestProgressHandler extends ICQRSHandler<ClaimGuestProgressCommand, ClaimGuestProgressResult> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly guests: AttemptGuestService,
        private readonly lessons: LessonReadService,
        private readonly marks: AttemptMarkService,
    ) {
        super(logger)
    }

    protected override async process(command: ClaimGuestProgressCommand): Promise<ClaimGuestProgressResult> {
        const learnerId = command.params.principal.id
        const { answers, sections } = command.params.request
        const merged = await this.guests.claim(learnerId, answers)
        const open = new Map<string, ReadonlySet<string>>()
        let sectionsClaimed = 0
        for (const read of sections) {
            if (!open.has(read.lessonId)) open.set(read.lessonId, await this.readableSections(learnerId, read.lessonId))
            if (open.get(read.lessonId)?.has(read.sectionId) !== true) continue
            await this.marks.markSectionRead(learnerId, read.lessonId, read.sectionId)
            sectionsClaimed += 1
        }
        return {
            answersClaimed: merged.claimed,
            answersSkipped: merged.skipped,
            sectionsClaimed,
            sectionsSkipped: sections.length - sectionsClaimed,
        }
    }

    /** The ids of the sections of a lesson the learner may read; none when the lesson is not found. */
    private async readableSections(learnerId: string, lessonId: string): Promise<ReadonlySet<string>> {
        try {
            const view = await this.lessons.find({ id: lessonId, locale: "vi", learnerId })
            return new Set(view.sections.filter((section) => !section.locked).map((section) => section.id))
        } catch (error) {
            if (error instanceof LessonError) return new Set()
            throw error
        }
    }
}
