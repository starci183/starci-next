import { QueryHandler } from "@nestjs/cqrs"
import { AttemptMarkService, AttemptOpenerService } from "@modules/domain/attempt"
import { LessonContentService } from "@modules/domain/lesson"
import { lessonPartsOf, LESSON_PART_IDS, RelayLessonService, type LessonPartId } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetLessonPartsProgressQuery } from "./get-lesson-parts-progress.query"
import type { LessonPartsProgressView } from "./get-lesson-parts-progress.contracts"

/** The entitlement part each page part reads. */
const ENTITLEMENT_PART = {
    essence: "1-essential",
    source: "2-source",
    scenarios: "3-scenarios",
    apply: "4-apply",
} as const

@QueryHandler(GetLessonPartsProgressQuery)
/**
 * Answers, per lesson, how far the learner is in each of the four parts, from the opener attempts, the relayed runs and the
 * challenge essence answers; a part the learner may not read is reported locked and its runs are never read.
 */
export class GetLessonPartsProgressHandler extends ICQRSHandler<
    GetLessonPartsProgressQuery,
    ReadonlyArray<LessonPartsProgressView>
> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly openers: AttemptOpenerService,
        private readonly marks: AttemptMarkService,
        private readonly content: LessonContentService,
        private readonly runs: RelayLessonService,
    ) {
        super(logger)
    }

    protected override async process(
        query: GetLessonPartsProgressQuery,
    ): Promise<ReadonlyArray<LessonPartsProgressView>> {
        const learnerId = query.params.principal.id
        const lessonIds = [...new Set(query.params.request.lessonIds)]
        const open = await Promise.all(
            LESSON_PART_IDS.map(
                async (part) => [part, await this.content.mayReadPart(learnerId, ENTITLEMENT_PART[part])] as const,
            ),
        )
        const readable = Object.fromEntries(open) as Record<LessonPartId, boolean>
        const [scores, hints, choices] = await Promise.all([
            this.openers.scores({ learnerId, lessonIds }),
            this.marks.hintUses(learnerId, lessonIds),
            readable.apply
                ? this.marks.challengeChoices(learnerId, lessonIds)
                : Promise.resolve(new Map<string, Map<string, boolean>>()),
        ])
        return Promise.all(
            lessonIds.map(async (lessonId): Promise<LessonPartsProgressView> => {
                const stored = await this.content.runnable(lessonId)
                const mayRun = readable.scenarios || readable.apply
                const [runs, hasEvents] = await Promise.all([
                    stored === null || !mayRun ? Promise.resolve([]) : this.runs.runs(learnerId, lessonId),
                    stored === null || !readable.source
                        ? Promise.resolve(false)
                        : this.runs.hasEvents(learnerId, lessonId),
                ])
                const opener = scores.find((score) => score.lessonId === lessonId)
                const { parts, inProgressPart } = lessonPartsOf({
                    essential: stored?.essential ?? null,
                    // The opener part is done once passed: every question picked right (a wrong pick may be picked again).
                    openerAnswered: opener?.solved ?? 0,
                    readable,
                    runs: runs.filter((run) => (run.slot === "challenge" ? readable.apply : readable.scenarios)),
                    hasEvents,
                    choices: choices.get(lessonId) ?? new Map<string, boolean>(),
                })
                return {
                    lessonId,
                    parts,
                    inProgressPart,
                    opener: {
                        answered: opener?.answered ?? 0,
                        firstCorrect: opener?.firstCorrect ?? 0,
                        latestCorrect: opener?.latestCorrect ?? 0,
                    },
                    proved: false,
                    usedHint: (hints.get(lessonId)?.size ?? 0) > 0,
                }
            }),
        )
    }
}
