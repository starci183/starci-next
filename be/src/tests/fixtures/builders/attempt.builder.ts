import { builder } from "@starci/jest-preset"
import type {
    AttemptService,
    AttemptAnswer,
    AttemptKind,
    AttemptResult,
    AttemptStatus,
    CoachGrade,
    CoachGradeRequest,
    StoredAttemptResult,
} from "@modules/domain/attempt"
import type { LessonActivity, LessonLocale, LessonPhase } from "@modules/domain/lesson"

/** The learner of the attempt specs. */
export const LEARNER = "10000000-0000-4000-8000-0000000000a1"

/** An attempt id for the specs. */
export const ATTEMPT_ID = "20000000-0000-4000-8000-0000000000a1"

/** The text of the learner that the demo grade quotes. */
export const WRITTEN_ANSWER =
    "In CQRS the read model lags behind the write side, so the reader sees eventual consistency."

/** A stored attempt as the capability reads it from its table. */
export interface StoredAttemptShape {
    /** The attempt id. */
    attempt_id: string
    /** The learner. */
    learner_id: string
    /** The lesson. */
    lesson_id: string
    /** The version. */
    lesson_version: string
    /** The activity. */
    activity_id: string
    /** The revision. */
    revision: number
    /** The kind. */
    kind: AttemptKind
    /** The phase. */
    phase: LessonPhase
    /** The locale. */
    locale: LessonLocale
    /** Whether the activity is a diagnostic. */
    is_diagnostic: boolean
    /** The normalized answer. */
    answer: AttemptAnswer
    /** The status. */
    status: AttemptStatus
    /** The result once graded. */
    result: StoredAttemptResult | null
    /** The failure code, or null. */
    failure_code: string | null
    /** When the answer was stored. */
    submitted_at: Date
    /** When it was graded. */
    graded_at: Date | null
}

/** The newest attempt of one activity as the progress read returns it: the whole attempt row and the attempt count. */
export interface ActivityProgressShape extends StoredAttemptShape {
    /** How many attempts the activity has. */
    attempts: number
}

/** What a submit is given. */
export type SubmitParams = Parameters<AttemptService["submit"]>[0]

/** An answer with no field set; a case overrides the fields of its kind. */
export const answerOf: (overrides?: Partial<AttemptAnswer>) => AttemptAnswer = builder<AttemptAnswer>({
    optionId: null,
    text: null,
    actionIds: null,
    reachedStateId: null,
    debrief: null,
    files: null,
})

/** An activity of the given kind with nothing but the fields every activity has: no rubric, options, simulation or exercise. */
export const bareActivityOf: (overrides?: Partial<LessonActivity>) => LessonActivity = builder<LessonActivity>({
    id: "bare",
    kind: "explain",
    prompt: "bare prompt",
    outcomeIds: [],
})

/** A result with nothing set; a case overrides the fields of its kind. */
export const resultOf: (overrides?: Partial<AttemptResult>) => AttemptResult = builder<AttemptResult>({
    isDiagnostic: false,
    correct: null,
    options: [],
    success: null,
    reachedStateId: null,
    criteria: [],
    score: 0,
    maxScore: 0,
})

/** The submit of a learner to the choice of the demo lesson. */
export const submitParamsOf: (overrides?: Partial<SubmitParams>) => SubmitParams = builder<SubmitParams>({
    learnerId: LEARNER,
    lessonId: "demo-lesson",
    version: "v1",
    activityId: "demo--predict",
    revision: 1,
    locale: "vi",
    answer: answerOf({ optionId: "demo--predict--1" }),
})

/** A stored attempt: the graded choice of the demo lesson. */
export const attemptRowOf: (overrides?: Partial<StoredAttemptShape>) => StoredAttemptShape =
    builder<StoredAttemptShape>({
        attempt_id: ATTEMPT_ID,
        learner_id: LEARNER,
        lesson_id: "demo-lesson",
        lesson_version: "v1",
        activity_id: "demo--predict",
        revision: 1,
        kind: "choice",
        phase: "predict",
        locale: "vi",
        is_diagnostic: false,
        answer: answerOf({ optionId: "demo--predict--1" }),
        status: "graded",
        result: resultOf({ correct: true, score: 1, maxScore: 1 }),
        failure_code: null,
        submitted_at: new Date("2026-11-08T10:00:00.000Z"),
        graded_at: new Date("2026-11-08T10:00:00.000Z"),
    })

/** The newest attempt of one activity with its attempt count: the graded choice of the demo lesson, attempted once. */
export const activityProgressRowOf: (overrides?: Partial<ActivityProgressShape>) => ActivityProgressShape = (
    overrides = {},
) => ({ ...attemptRowOf(), attempts: 1, ...overrides })

/** A grade that satisfies the rubric of the demo explain activity: both criteria quote the answer. */
export const coachGradeOf: (overrides?: Partial<CoachGrade>) => CoachGrade = builder<CoachGrade>({
    criteria: [
        { criterionId: "demo--interview--c1", level: 2, evidenceQuote: "the read model lags" },
        { criterionId: "demo--interview--c2", level: 1, evidenceQuote: "eventual consistency" },
    ],
})

/** The request a spec expects the coach to receive; override the fields of the case. */
export const coachRequestOf: (overrides?: Partial<CoachGradeRequest>) => CoachGradeRequest = builder<CoachGradeRequest>(
    {
        requestId: ATTEMPT_ID,
        locale: "vi",
        prompt: "vi: Explain how a read model goes stale.",
        kind: "explain",
        answerText: WRITTEN_ANSWER,
        files: [],
        rubric: [],
        timeoutMs: 60000,
    },
)

/** An attempt row of the explain activity of the challenge phase, stored and not yet taken for grading. */
export const writtenRowOf: (overrides?: Partial<StoredAttemptShape>) => StoredAttemptShape = (overrides = {}) =>
    attemptRowOf({
        activity_id: "demo--interview",
        kind: "explain",
        phase: "challenge",
        is_diagnostic: true,
        answer: answerOf({ text: WRITTEN_ANSWER }),
        status: "saved",
        result: null,
        graded_at: null,
        ...overrides,
    })

/** The submit of a learner to the explain activity of the challenge phase, with spaces around the text. */
export const writtenParamsOf: (overrides?: Partial<SubmitParams>) => SubmitParams = (overrides = {}) =>
    submitParamsOf({ activityId: "demo--interview", answer: answerOf({ text: `  ${WRITTEN_ANSWER}  ` }), ...overrides })

/** The code a refusal carries when running the callback throws, or null when it does not throw. */
export const codeOf = (run: () => unknown): unknown => {
    try {
        run()
    } catch (cause) {
        return cause instanceof Error && "code" in cause ? cause.code : cause
    }
    return null
}
