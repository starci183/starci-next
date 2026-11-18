import { QueryHandler } from "@nestjs/cqrs"
import { AttemptMarkService } from "@modules/domain/attempt"
import { LessonContentService } from "@modules/domain/lesson"
import {
    challengeScoresOf,
    RelayError,
    RelayErrorCode,
    RelayLessonService,
    type ChallengeScore,
} from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetLessonChallengeScoresQuery } from "./get-lesson-challenge-scores.query"

@QueryHandler(GetLessonChallengeScoresQuery)
/** Answers the rubric score of every rung of a lesson's ladder; Tự áp dụng is refused to a learner who may not read it. */
export class GetLessonChallengeScoresHandler extends ICQRSHandler<
    GetLessonChallengeScoresQuery,
    ReadonlyArray<ChallengeScore>
> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly marks: AttemptMarkService,
        private readonly content: LessonContentService,
        private readonly runs: RelayLessonService,
    ) {
        super(logger)
    }

    protected override async process(query: GetLessonChallengeScoresQuery): Promise<ReadonlyArray<ChallengeScore>> {
        const learnerId = query.params.principal.id
        const { lessonId } = query.params.request
        await this.content.requireAccess({ learnerId, phase: "apply", isPremium: undefined, part: "4-apply" })
        const stored = await this.content.runnable(lessonId)
        if (stored === null) throw new RelayError({ code: RelayErrorCode.LessonNotRunnable })
        const [runs, choices] = await Promise.all([
            this.runs.runs(learnerId, lessonId),
            this.marks.challengeChoices(learnerId, [lessonId]),
        ])
        return challengeScoresOf(stored.essential, runs, choices.get(lessonId) ?? new Map<string, boolean>())
    }
}
