import type { OpenerScoreView } from "@modules/domain/attempt"
import type { LessonPartId, LessonPartProgress } from "@modules/domain/relay"

/** The four-part progress of one lesson for one learner. */
export interface LessonPartsProgressView {
    /** The lesson. */
    readonly lessonId: string
    /** The four parts in the order of the page tabs. */
    readonly parts: ReadonlyArray<LessonPartProgress>
    /** The part "Học tiếp" opens, or null when every part is done or the lesson ships none. */
    readonly inProgressPart: LessonPartId | null
    /** The opener before and after: answered, right the first time, right now. */
    readonly opener: Pick<OpenerScoreView, "answered" | "firstCorrect" | "latestCorrect">
    /** The lesson is "Đã chứng minh": always false until a lesson has CI (OIDC) evidence; the project and harness proofs are not lessons. */
    readonly proved: boolean
    /** True when the learner asked for a scenario hint: the lesson reads "có hỗ trợ". */
    readonly usedHint: boolean
}
