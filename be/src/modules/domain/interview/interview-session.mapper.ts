import type {
    HistoryItem,
    LessonsByModule,
    ModuleLessons,
    InterviewLocale,
    InterviewSetup,
    InterviewTier,
    EvidenceItem,
    QuestionView,
    SessionView,
    TrendView,
    TurnKind,
    TurnRole,
    TurnView,
} from "./interview.contracts"
import { promptOf } from "./question-lookup.policy"
import type { EvidenceRow, HistoryRow, QuestionPublicRow, SessionRow, TurnRow } from "./persistence/interview.rows"

/** The setup a session was started with. */
export const toSetup = (row: SessionRow): InterviewSetup => ({
    track: row.track,
    tier: row.tier,
    locale: row.locale,
    language: row.language,
    length: row.length,
    access: row.access,
})

/** One stored turn as the learner reads it. */
export const toTurnView = (row: TurnRow): TurnView => ({
    turnId: row.turn_id,
    position: row.position,
    role: row.role,
    kind: row.kind,
    content: row.content,
    revision: row.revision,
    createdAt: row.created_at.toISOString(),
})

/**
 * One drawn question as the learner reads it while the interview runs: the prompt, the code or diagram to read, and how many hints
 * exist. Nothing used for grading is on this path: not the ideal answer, the rubric, the checklist, the keywords or the samples.
 */
export const toQuestionView = (
    row: QuestionPublicRow,
    position: number,
    bodyLanguage: string,
    locale: InterviewLocale,
): QuestionView => {
    const prompt = promptOf(row.bodies, bodyLanguage, locale)
    return {
        position,
        family: row.family,
        tier: row.tier,
        kind: row.kind,
        bankTitle: row.bank_titles[locale],
        prompt: prompt.prompt,
        givenCode: prompt.givenCode,
        diagram: prompt.diagram,
        bodyLanguage,
        hintCount: row.interviewer[locale].hints.length,
    }
}

/**
 * The session as the learner reads it. The scorecard, the ideal answers inside it, the lessons and the grading model appear only
 * once the status is graded; before that every one of them is null or empty, whatever the row holds.
 */
export const toSessionView = (
    row: SessionRow,
    turns: ReadonlyArray<TurnRow>,
    questions: ReadonlyArray<QuestionPublicRow>,
    lessons: LessonsByModule,
    previousScore: number | null,
): SessionView => {
    const locale = row.locale
    const graded = row.status === "graded"
    return {
        sessionId: row.session_id,
        setup: toSetup(row),
        status: row.status,
        position: row.current_position,
        questions: row.questions.flatMap((drawn) => {
            const found = questions.find(
                (entry) => entry.question_id === drawn.questionId && entry.bank_version === drawn.bankVersion,
            )
            return found === undefined ? [] : [toQuestionView(found, drawn.position, drawn.bodyLanguage, locale)]
        }),
        turns: turns.map((turn) => toTurnView(turn)),
        scorecard: graded ? row.scorecard : null,
        lessons: graded ? lessons : {},
        previousScore: graded ? previousScore : null,
        gradedBy: graded ? row.graded_by : null,
        failureCode: row.failure_code,
        startedAt: row.started_at.toISOString(),
        gradedAt: row.graded_at === null ? null : row.graded_at.toISOString(),
    }
}

/** One session of the history. */
export const toHistoryItem = (row: HistoryRow | SessionRow): HistoryItem => ({
    sessionId: row.session_id,
    track: row.track,
    tier: row.tier,
    startedAt: row.started_at.toISOString(),
    status: row.status,
    overallScore: row.overall_score,
    verdict: row.verdict,
})

/** The scores of graded sessions per track and tier, oldest first; sessions that are not graded have no score and are left out. */
export const toTrends = (rows: ReadonlyArray<HistoryRow>): ReadonlyArray<TrendView> => {
    const trends = new Map<string, { track: string; tier: InterviewTier; scores: Array<number> }>()
    ;[...rows].reverse().forEach((row) => {
        if (row.overall_score === null) return
        const key = `${row.track}|${row.tier}`
        const held = trends.get(key) ?? { track: row.track, tier: row.tier, scores: [] }
        held.scores.push(row.overall_score)
        trends.set(key, held)
    })
    return [...trends.values()]
}

/** One best result as evidence for the profile and the path. */
export const toEvidenceItem = (row: EvidenceRow): EvidenceItem => ({
    track: row.track,
    family: row.family,
    tier: row.tier,
    bestScore: row.score,
    verdict: row.verdict,
    sessionId: row.session_id,
    gradedAt: row.graded_at.toISOString(),
})

/** The lines of a question's conversation the model may read: the prompt, the follow-ups and the candidate's words; hints and the closing line are not part of it. */
export const toTranscript = (
    turns: ReadonlyArray<TurnRow>,
): ReadonlyArray<{ readonly role: TurnRole; readonly kind: TurnKind; readonly content: string }> =>
    turns
        .filter((turn) => turn.kind !== "hint" && turn.kind !== "done")
        .map((turn) => ({ role: turn.role, kind: turn.kind, content: turn.content }))

/** The lessons of a session as a list, one entry per module slug in the order the report holds them. */
export const toModuleLessons = (view: SessionView): ReadonlyArray<ModuleLessons> =>
    Object.entries(view.lessons).map(([moduleRef, links]) => ({ moduleRef, lessons: links }))
