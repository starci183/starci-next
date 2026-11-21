import { QueryHandler } from "@nestjs/cqrs"
import { AttemptMarkService } from "@modules/domain/attempt"
import { LessonContentService, LessonError, LessonErrorCode, type LessonBugPack } from "@modules/domain/lesson"
import {
    bugResultsOf,
    RelayLessonService,
    type LessonBugResult,
    type LessonScenarioRunView,
} from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetLessonBugResultsQuery } from "./get-lesson-bug-results.query"
import type { GetLessonBugResultsRequest } from "./get-lesson-bug-results.contracts"

/** What the bug-pack doors judge: the pack, the learner's newest runs and the hint uses of the lesson. */
export interface LessonBugFacts {
    readonly pack: LessonBugPack
    readonly runs: ReadonlyArray<LessonScenarioRunView>
    readonly hintKeys: ReadonlySet<string>
}

/** The services the bug-pack facts are read with. */
export interface LessonBugReaders {
    readonly content: LessonContentService
    readonly runs: RelayLessonService
    readonly marks: AttemptMarkService
}

/** Reads the facts once Tìm sạn is readable (Premium by default); not found for a lesson without a bug pack. */
export const lessonBugFactsOf = async (
    readers: LessonBugReaders,
    learnerId: string,
    request: GetLessonBugResultsRequest,
): Promise<LessonBugFacts> => {
    await readers.content.requireAccess({ learnerId, phase: "apply", isPremium: undefined, part: "3-scenarios" })
    const pack = await readers.content.bugPack(request.lessonId, request.locale)
    if (pack === null) throw new LessonError({ code: LessonErrorCode.NotFound })
    const [runs, uses] = await Promise.all([
        readers.runs.runs(learnerId, request.lessonId),
        readers.marks.hintUses(learnerId, [request.lessonId]),
    ])
    return { pack, runs, hintKeys: new Set(uses.get(request.lessonId) ?? []) }
}

@QueryHandler(GetLessonBugResultsQuery)
/**
 * Answers every Tìm sạn test of a lesson with the learner's newest relayed run: "Vì sao giờ đúng" only after a green run, "Vì sao chưa
 * pass" and the opened hints only after a red one, the final test locked until every other test is green.
 */
export class GetLessonBugResultsHandler extends ICQRSHandler<GetLessonBugResultsQuery, ReadonlyArray<LessonBugResult>> {
    constructor(
        @InjectLogger() logger: Logger,
        readonly content: LessonContentService,
        readonly runs: RelayLessonService,
        readonly marks: AttemptMarkService,
    ) {
        super(logger)
    }

    protected override async process(query: GetLessonBugResultsQuery): Promise<ReadonlyArray<LessonBugResult>> {
        const facts = await lessonBugFactsOf(this, query.params.principal.id, query.params.request)
        return bugResultsOf(facts.pack, facts.runs, facts.hintKeys)
    }
}
