/** One turn of the transcript as the door shows it. */
export interface Turn {
    readonly kind: string
    readonly content: string
    readonly position: number
}
/** A drawn question: its position and family. */
export interface QuestionBody {
    readonly position: number
    readonly family: string
}
/** A question of the scorecard with its score. */
export interface ScoredQuestionBody {
    readonly idealAnswer: string
    readonly score: number
    readonly hintsUsed: number
}
/** A gap with the modules it links to. */
export interface GapBody {
    readonly moduleRefs: ReadonlyArray<string>
}
/** The scorecard of a graded session. */
export interface ScorecardBody {
    readonly overallScore: number
    readonly verdict: string
    readonly technicalScore: number | null
    readonly behavioralScore: number | null
    readonly questions: ReadonlyArray<ScoredQuestionBody>
    readonly gaps: ReadonlyArray<GapBody>
}
/** The model profile that graded a session. */
export interface GradedByBody {
    readonly profile: string
}
/** A session as the door answers it. */
export interface SessionBody {
    readonly sessionId: string
    readonly status: string
    readonly position: number
    readonly questions: ReadonlyArray<QuestionBody>
    readonly turns: ReadonlyArray<Turn>
    readonly scorecard: null | ScorecardBody
    readonly gradedBy: null | GradedByBody
}
/** The access of the learner in the options. */
export interface AccessBody {
    readonly isPremium: boolean
    readonly freeSessionsLeftThisMonth: number
    readonly length: number
}
/** A track in the options. */
export interface TrackBody {
    readonly id: string
}
/** A bank in the options. */
export interface BankBody {
    readonly bankId: string
}
/** The access, tracks and banks of the options. */
export interface OptionsListBody {
    readonly access: AccessBody
    readonly tracks: ReadonlyArray<TrackBody>
    readonly banks: ReadonlyArray<BankBody>
}
/** The options query answer. */
export interface OptionsBody {
    readonly interviewOptions: OptionsListBody
}
/** The start mutation answer. */
export interface StartedBody {
    readonly startInterview: SessionBody
}
/** The session query answer. */
export interface ReadBody {
    readonly interviewSession: SessionBody
}
/** The result of an answer mutation. */
export interface AnsweredTurnBody {
    readonly status: string
    readonly failureCode: string | null
    readonly next: Turn
}
/** The answer mutation answer. */
export interface AnsweredBody {
    readonly answerInterview: AnsweredTurnBody
}
/** The turn that follows the last answer. */
export interface ClosingTurnBody {
    readonly next: Turn
}
/** The answer mutation answer of the last question. */
export interface DoneBody {
    readonly answerInterview: ClosingTurnBody
}
/** The result of a submit mutation. */
export interface SubmittedResultBody {
    readonly status: string
    readonly failureCode: string | null
}
/** The submit mutation answer. */
export interface SubmittedBody {
    readonly submitInterview: SubmittedResultBody
}
/** One session of the history. */
export interface HistoryItemBody {
    readonly sessionId: string
    readonly overallScore: number
}
/** The history items. */
export interface HistoryListBody {
    readonly items: ReadonlyArray<HistoryItemBody>
}
/** The history query answer. */
export interface HistoryBody {
    readonly interviewHistory: HistoryListBody
}
/** The next prompt turn: its kind and position. */
export interface NextPromptBody {
    readonly kind: string
    readonly position: number
}
/** The result of an answer while the provider is down. */
export interface ProviderDownResultBody {
    readonly failureCode: string | null
    readonly next: NextPromptBody
}
/** The answer mutation answer while the provider is down. */
export interface ProviderDownBody {
    readonly answerInterview: ProviderDownResultBody
}
/** One message of a recorded chat request. */
export interface ChatMessage {
    readonly role: string
    readonly content: string
}
