import { QueryHandler } from "@nestjs/cqrs"
import { AttemptMarkService } from "@modules/domain/attempt"
import { LessonReadService, type LessonView } from "@modules/domain/lesson"
import { RelayLessonService } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetLessonQuery } from "./get-lesson.query"

/**
 * Withholds the hint of every scenario the learner has not unlocked: a hint opens after the learner's own red run of that scenario
 * (its newest run failed) or after `revealLessonHint`. The page never receives the text before; it receives `isHintLocked`.
 */
const withHeldHints = (view: LessonView, unlocked: ReadonlySet<string>): LessonView => {
    const essential = view.essential
    if (essential === undefined || essential === null) return view
    return {
        ...view,
        essential: {
            ...essential,
            scenarios: essential.scenarios.map((scenario) =>
                scenario.hint === null || unlocked.has(scenario.id)
                    ? scenario
                    : { ...scenario, hint: null, isHintLocked: true },
            ),
        },
    }
}

@QueryHandler(GetLessonQuery)
/** Answers the public projection of one lesson for the learner who asked. */
export class GetLessonHandler extends ICQRSHandler<GetLessonQuery, LessonView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly lessons: LessonReadService,
        private readonly runs: RelayLessonService,
        private readonly marks: AttemptMarkService,
    ) {
        super(logger)
    }

    protected override async process(query: GetLessonQuery): Promise<LessonView> {
        const learnerId = query.params.principal?.id
        if (learnerId === undefined) {
            // A guest reads as a reader without Premium and owns no runs or hint uses: every hint stays withheld.
            const guestView = await this.lessons.read({
                id: query.params.request.id,
                locale: query.params.request.locale,
                isPremium: false,
            })
            return withHeldHints(guestView, new Set())
        }
        const view = await this.lessons.find({
            id: query.params.request.id,
            locale: query.params.request.locale,
            learnerId,
        })
        const scenarios = view.essential?.scenarios ?? []
        if (!scenarios.some((scenario) => scenario.hint !== null)) return view
        const [runs, uses] = await Promise.all([
            this.runs.runs(learnerId, view.id),
            this.marks.hintUses(learnerId, [view.id]),
        ])
        const unlocked = new Set(uses.get(view.id) ?? [])
        for (const run of runs) if (run.slot !== "challenge" && run.status === "failed") unlocked.add(run.scenarioId)
        return withHeldHints(view, unlocked)
    }
}
