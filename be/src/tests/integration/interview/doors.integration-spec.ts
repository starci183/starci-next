import { eachInOrder } from "@modules/platform/primitives"
import {
    type ScorecardBody,
    type OptionsBody,
    type StartedBody,
    type ReadBody,
    type AnsweredBody,
    type DoneBody,
    type SubmittedBody,
    type HistoryBody,
    type ProviderDownBody,
    type ChatMessage,
} from "../../fixtures/builders/interview-doors.builder"
import { learnersOf } from "../../fixtures/builders/identity.builder"
import { ANSWER_TEXT, PREMIUM_QUESTION, persistInterviewBanks } from "../../fixtures/builders/interview.builder"
import { useAiCoachWorld } from "../../world/ai-coach-world.options"
import { attemptDoors, type AttemptDoors } from "../../world/attempt-doors.client"
import type { OpenrouterFakeClient } from "../../world/fakes/openrouter/openrouter.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

const SESSION_FIELDS = `sessionId status position failureCode
  setup { track tier locale length access }
  questions { position family kind prompt givenCode hintCount bodyLanguage }
  turns { turnId position role kind content revision }
  scorecard { overallScore verdict technicalScore technicalVerdict behavioralScore behavioralVerdict
    questions { position family score hintsUsed criticalMissed idealAnswer checklist { text hit evidenceQuote } dimensions { key level } }
    gaps { text moduleRefs } strengths }
  gradedBy { profile usedFallback }`

const OPTIONS = `query O($input: InterviewOptionsInput!) { interviewOptions(input: $input) { tracks { id title } banks { bankId } access { isPremium freeSessionsLeftThisMonth length } active { sessionId } } }`
const START = `mutation S($input: StartInterviewInput!) { startInterview(input: $input) { ${SESSION_FIELDS} } }`
const ANSWER = `mutation A($input: AnswerInterviewInput!) { answerInterview(input: $input) { status failureCode saved { kind content revision } next { kind position content } } }`
const HINT = `mutation H($input: InterviewHintInput!) { interviewHint(input: $input) { text hintsUsed hintsLeft } }`
const RETRY = `mutation R($input: InterviewSessionRefInput!) { retryInterviewTurn(input: $input) { failureCode next { kind content } } }`
const REGRADE = `mutation G($input: InterviewSessionRefInput!) { regradeInterview(input: $input) { sessionId status failureCode } }`
const SUBMIT = `mutation U($input: InterviewSessionRefInput!) { submitInterview(input: $input) { sessionId status failureCode } }`
const SESSION = `query Q($input: InterviewSessionRefInput!) { interviewSession(input: $input) { ${SESSION_FIELDS} } }`
const ABANDON = `mutation B($input: InterviewSessionRefInput!) { abandonInterview(input: $input) { status } }`
const READINESS = `query D($input: InterviewReadinessInput!) { interviewReadiness(input: $input) { ready technical { verdict } behavioral { verdict } } }`
const HISTORY = `query Y($input: InterviewHistoryInput!) { interviewHistory(input: $input) { items { sessionId status overallScore verdict } trend { scores } } }`

/** What a case of the doors drives: the doors, a source of new learners and the OpenRouter fake. */
interface DoorsCase {
    /** The doors of the booted core app. */
    readonly doors: AttemptDoors
    /** A learner nobody used before in the file. */
    readonly nextLearner: ReturnType<typeof learnersOf>
    /** The OpenRouter fake behind the pool. */
    fake(): OpenrouterFakeClient | undefined
    /** How many requests the fake recorded. */
    calls(): Promise<number>
}

const quote = "put it in the service layer"
const technicalReading = (position: number) => ({
    position,
    checklist: [
        { item: 0, hit: true, evidenceQuote: quote },
        { item: 1, hit: false, evidenceQuote: "" },
    ],
    dimensions: [],
    ownershipWeak: false,
    note: "Missed the trade-off.",
})
const behavioralReading = (position: number) => ({
    position,
    checklist: [],
    dimensions: [
        "situationClarity",
        "actionSpecificity",
        "resultImpact",
        "selfAwareness",
        "communication",
        "relevanceToRole",
    ].map((key) => ({ key, level: 3, evidenceQuote: "put it in the service layer" })),
    ownershipWeak: false,
    note: "",
})
const NEXT = JSON.stringify({ action: "next", text: "" })
const FOLLOW_UP = JSON.stringify({ action: "followUp", text: "Why that layer?" })

/** The answer the learner gives at one position of the scoped-quote case. */
const own = (position: number): string => `answer number ${position} about the service layer`

/** The messages of a recorded chat request body; one marked unreadable when the body is not JSON. */
const messagesOf = (body: string): ReadonlyArray<ChatMessage> => {
    try {
        const parsed: unknown = JSON.parse(body)
        const messages: unknown =
            typeof parsed === "object" && parsed !== null && "messages" in parsed ? parsed.messages : []
        const list: ReadonlyArray<unknown> = Array.isArray(messages) ? messages : []
        return list.flatMap((message) =>
            typeof message === "object" &&
            message !== null &&
            "role" in message &&
            "content" in message &&
            typeof message.role === "string" &&
            typeof message.content === "string"
                ? [{ role: message.role, content: message.content }]
                : [],
        )
    } catch (cause) {
        return [{ role: "unreadable", content: String(cause) }]
    }
}

const FREE_OPTIONS_INPUT = { input: { locale: "en", track: "backend-fullstack" } }

/** Reads the options of a free learner: one session left this month, three questions long, two banks on the track. */
const checkFreeOptions = async (c: DoorsCase, cookie: string): Promise<void> => {
    const options = await c.doors.ask<OptionsBody>(OPTIONS, FREE_OPTIONS_INPUT, cookie)
    expect(options.data?.interviewOptions.access).toEqual({
        isPremium: false,
        freeSessionsLeftThisMonth: 1,
        length: 3,
    })
    expect(options.data?.interviewOptions.banks).toHaveLength(2)
}

/** Starts the free session and proves that nothing used for grading comes back; answers the session id. */
const startFreeSession = async (c: DoorsCase, cookie: string): Promise<string> => {
    const started = await c.doors.ask<StartedBody>(
        START,
        { input: { track: "backend-fullstack", tier: "junior", locale: "en", clientRequestId: "request-free-1" } },
        cookie,
    )
    const session = started.data?.startInterview
    expect(session?.questions.map((entry) => entry.family)).toEqual(["technical", "technical", "behavioral"])
    expect(session?.turns).toHaveLength(1)
    expect(session?.scorecard).toBeNull()
    const text = JSON.stringify(started)
    expect(text).not.toMatch(/Names the layer|Put it in the service|checklist|rubric|keywords|ownershipSignal/u)
    expect(text).not.toContain(PREMIUM_QUESTION)
    expect(await c.calls()).toBe(0)
    return session?.sessionId ?? ""
}

/** Answers every question of the free session, asks for a hint, and proves that no feedback comes back in between. */
const answerFreeSession = async (c: DoorsCase, cookie: string, sessionId: string): Promise<void> => {
    await c.fake()?.reply(FOLLOW_UP)
    const first = await c.doors.ask<AnsweredBody>(
        ANSWER,
        { input: { sessionId, position: 0, revision: 0, text: ANSWER_TEXT } },
        cookie,
    )
    expect(first.data?.answerInterview).toMatchObject({
        failureCode: null,
        saved: { kind: "answer", content: ANSWER_TEXT },
        next: { kind: "followUp", content: "Why that layer?" },
    })
    expect(JSON.stringify(first)).not.toMatch(/score|verdict|correct/iu)
    const hint = await c.doors.ask(HINT, { input: { sessionId, position: 0 } }, cookie)
    expect(hint.data).toMatchObject({ interviewHint: { text: "Hint one", hintsUsed: 1, hintsLeft: 1 } })

    await c.fake()?.reply(NEXT)
    await c.doors.ask(ANSWER, { input: { sessionId, position: 0, revision: 1, text: ANSWER_TEXT } }, cookie)
    await c.doors.ask(ANSWER, { input: { sessionId, position: 1, revision: 0, text: ANSWER_TEXT } }, cookie)
    const last = await c.doors.ask<DoneBody>(
        ANSWER,
        { input: { sessionId, position: 2, revision: 0, text: ANSWER_TEXT } },
        cookie,
    )
    expect(last.data?.answerInterview.next.kind).toBe("done")
    expect(JSON.stringify(await c.doors.ask(SESSION, { input: { sessionId } }, cookie))).not.toContain('overallScore":')
}

/** Submits the free session for its one grading and reads the scorecard back; answers the scorecard. */
const gradeFreeSession = async (c: DoorsCase, cookie: string, sessionId: string): Promise<ScorecardBody | null> => {
    const callsBeforeGrading = await c.calls()
    await c
        .fake()
        ?.reply(JSON.stringify({ questions: [technicalReading(0), technicalReading(1), behavioralReading(2)] }))
    const graded = await c.doors.ask<SubmittedBody>(SUBMIT, { input: { sessionId } }, cookie)
    expect(graded.data?.submitInterview).toEqual({ sessionId, status: "graded", failureCode: null })
    expect(await c.calls()).toBe(callsBeforeGrading + 1)

    const read = await c.doors.ask<ReadBody>(SESSION, { input: { sessionId } }, cookie)
    const card = read.data?.interviewSession.scorecard ?? null
    expect(typeof card?.technicalScore).toBe("number")
    expect(card?.behavioralScore).toBe(75)
    expect(card?.questions[0]).toMatchObject({ score: 55, hintsUsed: 1, idealAnswer: "Put it in the service." })
    expect(card?.gaps[0]?.moduleRefs).toEqual(["0-core"])
    expect(read.data?.interviewSession.gradedBy?.profile).toBe("interview")
    return card
}

/** Proves that the month's quota is spent, that no model call came of the refusal, and that the history holds the session. */
const checkQuotaAndHistory = async (
    c: DoorsCase,
    cookie: string,
    sessionId: string,
    card: ScorecardBody | null,
): Promise<void> => {
    const callsAtEnd = await c.calls()
    const second = await c.doors.ask(
        START,
        { input: { track: "backend-fullstack", tier: "junior", clientRequestId: "request-free-2" } },
        cookie,
    )
    expect(second.errors?.[0]?.extensions).toMatchObject({ code: "INTERVIEW_PREMIUM_REQUIRED", kind: "forbidden" })
    expect(await c.calls()).toBe(callsAtEnd)

    const readiness = await c.doors.ask(READINESS, { input: { track: "backend-fullstack", tier: "junior" } }, cookie)
    expect(readiness.data).toMatchObject({ interviewReadiness: { ready: false } })
    const history = await c.doors.ask<HistoryBody>(HISTORY, { input: {} }, cookie)
    expect(history.data?.interviewHistory.items).toHaveLength(1)
    expect(history.data?.interviewHistory.items[0]).toMatchObject({ sessionId, overallScore: card?.overallScore })
}

/** Runs a free interview end to end. */
const runFreeInterview = async (c: DoorsCase): Promise<void> => {
    const { cookie, subject } = await c.doors.signIn(c.nextLearner(), false)
    await checkFreeOptions(c, cookie)
    const sessionId = await startFreeSession(c, cookie)
    await answerFreeSession(c, cookie, sessionId)
    const card = await gradeFreeSession(c, cookie, sessionId)
    await checkQuotaAndHistory(c, cookie, sessionId, card)
    expect(subject).toBeDefined()
}

/** Proves that another learner sees neither the history nor the session. */
const checkOtherLearner = async (c: DoorsCase, cookie: string, sessionId: string): Promise<void> => {
    const otherHistory = await c.doors.ask<HistoryBody>(HISTORY, { input: {} }, cookie)
    expect(otherHistory.data?.interviewHistory.items).toEqual([])
    const stranger = await c.doors.ask(SESSION, { input: { sessionId } }, cookie)
    expect(stranger.errors?.[0]?.extensions).toMatchObject({ code: "INTERVIEW_SESSION_NOT_FOUND" })
}

/** Keeps a saved answer while the provider is down, and shows a session to its learner only. */
const runProviderDown = async (c: DoorsCase): Promise<void> => {
    const { cookie } = await c.doors.signIn(c.nextLearner(), true)
    const other = await c.doors.signIn(c.nextLearner(), true)
    const started = await c.doors.ask<StartedBody>(
        START,
        { input: { track: "backend-fullstack", tier: "junior", clientRequestId: "request-prem-1" } },
        cookie,
    )
    const sessionId = started.data?.startInterview.sessionId ?? ""
    expect(started.data?.startInterview.questions).toHaveLength(5)

    await c.fake()?.failNext({ status: 503, times: 10 })
    const down = await c.doors.ask<ProviderDownBody>(
        ANSWER,
        { input: { sessionId, position: 0, revision: 0, text: ANSWER_TEXT } },
        cookie,
    )
    expect(down.data?.answerInterview).toMatchObject({
        failureCode: null,
        next: { kind: "prompt", position: 1 },
        saved: { content: ANSWER_TEXT },
    })
    const nothing = await c.doors.ask(RETRY, { input: { sessionId } }, cookie)
    expect(nothing.errors?.[0]?.extensions).toMatchObject({ code: "INTERVIEW_NOTHING_TO_RETRY" })
    const stillOpen = await c.doors.ask<ReadBody>(SESSION, { input: { sessionId } }, cookie)
    expect(stillOpen.data?.interviewSession).toMatchObject({ status: "active", position: 1 })

    const conflict = await c.doors.ask(
        ANSWER,
        { input: { sessionId, position: 0, revision: 0, text: "something else" } },
        cookie,
    )
    expect(conflict.errors?.[0]?.extensions).toMatchObject({ code: "INTERVIEW_REVISION_CONFLICT" })
    await checkOtherLearner(c, other.cookie, sessionId)
    const active = await c.doors.ask(
        START,
        { input: { track: "backend-fullstack", tier: "junior", clientRequestId: "request-prem-2" } },
        cookie,
    )
    expect(active.errors?.[0]?.extensions).toMatchObject({ code: "INTERVIEW_SESSION_ACTIVE" })
    const abandoned = await c.doors.ask(ABANDON, { input: { sessionId } }, cookie)
    expect(abandoned.data).toMatchObject({ abandonInterview: { status: "abandoned" } })
}

/** Fails the grading with a stable code when the model quotes words the learner never wrote. */
const runInventedQuote = async (c: DoorsCase): Promise<void> => {
    const { cookie } = await c.doors.signIn(c.nextLearner(), true)
    const started = await c.doors.ask<StartedBody>(
        START,
        { input: { track: "backend-fullstack", tier: "junior", clientRequestId: "request-bad-1" } },
        cookie,
    )
    const sessionId = started.data?.startInterview.sessionId ?? ""
    await c.fake()?.reply(NEXT)
    await c.doors.ask(ANSWER, { input: { sessionId, position: 0, revision: 0, text: ANSWER_TEXT } }, cookie)

    await c.fake()?.reply(
        JSON.stringify({
            questions: [
                {
                    ...technicalReading(0),
                    checklist: [
                        { item: 0, hit: true, evidenceQuote: "never said this" },
                        { item: 1, hit: false, evidenceQuote: "" },
                    ],
                },
            ],
        }),
    )
    const failed = await c.doors.ask(SUBMIT, { input: { sessionId } }, cookie)
    expect(failed.errors).toBeUndefined()

    expect(failed.data).toMatchObject({
        submitInterview: { status: "failed", failureCode: "INTERVIEW_COACH_INVALID" },
    })
    const read = await c.doors.ask<ReadBody>(SESSION, { input: { sessionId } }, cookie)
    expect(read.data?.interviewSession.turns.some((turn) => turn.content === ANSWER_TEXT)).toBe(true)
    expect(read.data?.interviewSession.scorecard).toBeNull()
}

/** A model reading of the whole scoped-quote session, quoting each answer through `quoteOf`. */
const scopedReading = (families: ReadonlyArray<string>, quoteOf: (position: number) => string): string =>
    JSON.stringify({
        questions: families.map((family, position) =>
            family === "technical"
                ? {
                      position,
                      checklist: [
                          { item: 0, hit: true, evidenceQuote: quoteOf(position) },
                          { item: 1, hit: false, evidenceQuote: "" },
                      ],
                      dimensions: [],
                      ownershipWeak: false,
                      note: "",
                  }
                : {
                      ...behavioralReading(position),
                      dimensions: behavioralReading(position).dimensions.map((entry) => ({
                          ...entry,
                          evidenceQuote: quoteOf(position),
                      })),
                  },
        ),
    })

/** Proves that the grading request holds one rubric block per question and that each transcript holds its own answer only. */
const checkGradingRequest = async (c: DoorsCase, families: ReadonlyArray<string>): Promise<void> => {
    const request = ((await c.fake()?.requests()) ?? []).at(-1)
    const messages = messagesOf(request?.body ?? "{}")
    const system = messages.find((message) => message.role === "system")?.content ?? ""
    const user = messages.find((message) => message.role === "user")?.content ?? ""
    const checklistBlocks = system.match(/Checklist \(index/gu) ?? []
    const starBlocks = system.match(/STAR dimensions, graded 0 to 4/gu) ?? []
    expect(checklistBlocks).toHaveLength(families.filter((family) => family === "technical").length)
    expect(starBlocks).toHaveLength(families.filter((family) => family === "behavioral").length)
    families.forEach((_family, position) => {
        const section =
            user
                .split("=== Transcript of the question at position ")
                .find((part) => part.startsWith(`${position} ===`)) ?? ""
        expect(section).toContain(own(position))
        families.forEach((_other, other) => {
            if (other !== position) expect(section).not.toContain(own(other))
        })
    })
}

/** Answers the questions one after another, in the order they were asked. */
const answerEach = async (c: DoorsCase, cookie: string, sessionId: string, count: number): Promise<void> => {
    await eachInOrder([...Array(count).keys()], async (position) => {
        await c.doors.ask(ANSWER, { input: { sessionId, position, revision: 0, text: own(position) } }, cookie)
    })
}

/** Grades each question on its own rubric: a quote taken from another question's answer is refused. */
const runScopedQuotes = async (c: DoorsCase): Promise<void> => {
    const { cookie } = await c.doors.signIn(c.nextLearner(), true)
    const started = await c.doors.ask<StartedBody>(
        START,
        { input: { track: "backend-fullstack", tier: "junior", clientRequestId: "request-scope-1" } },
        cookie,
    )
    const sessionId = started.data?.startInterview.sessionId ?? ""
    const families = started.data?.startInterview.questions.map((entry) => entry.family) ?? []
    await c.fake()?.reply(NEXT)
    await answerEach(c, cookie, sessionId, families.length)

    await c.fake()?.reply(scopedReading(families, (position) => own(Math.max(0, position - 1))))
    const refused = await c.doors.ask(SUBMIT, { input: { sessionId } }, cookie)
    expect(refused.data).toMatchObject({
        submitInterview: { status: "failed", failureCode: "INTERVIEW_COACH_INVALID" },
    })

    await c.fake()?.reset()
    await c.fake()?.reply(scopedReading(families, (position) => own(position)))
    const graded = await c.doors.ask(REGRADE, { input: { sessionId } }, cookie)
    expect(graded.data).toMatchObject({ regradeInterview: { status: "graded" } })

    await checkGradingRequest(c, families)
    const read = await c.doors.ask<ReadBody>(SESSION, { input: { sessionId } }, cookie)
    const scored = read.data?.interviewSession.scorecard?.questions ?? []
    expect(scored).toHaveLength(families.length)
}

/**
 * The mock interview doors (integration): the real core app behind the real session guard, the real gateway and the real
 * `@starci/ai-router` pool, with OpenRouter as the only double. It proves the whole path: start, answer, hint, retry, the single
 * grading, the release of the scorecard, the free monthly quota and that nothing used for grading is shown before the grade.
 */
describe("mock interview doors (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const aiWorld = useAiCoachWorld(world)
    const doors = attemptDoors(world)
    const doorsCase: DoorsCase = {
        doors,
        nextLearner: learnersOf("d1"),
        fake: () => aiWorld.openrouter(),
        calls: async () => ((await aiWorld.openrouter()?.requests()) ?? []).length,
    }

    beforeEach(async () => {
        await doors.reset()
        await persistInterviewBanks(doors.db())
        await aiWorld.openrouter()?.reset()
    })

    it.each([
        [OPTIONS, { input: { locale: "vi" } }],
        [START, { input: { track: "backend-fullstack", tier: "junior", clientRequestId: "request-0001" } }],
        [SESSION, { input: { sessionId: "20000000-0000-4000-8000-0000000000a1" } }],
        [READINESS, { input: { track: "backend-fullstack", tier: "junior" } }],
    ])("refuses a caller with no session", async (query, variables) => {
        const answer = await doors.ask(query, variables)

        expect(answer.data ?? null).toBeNull()
        expect(answer.errors?.[0]?.extensions).toMatchObject({
            code: "IDENTITY_SESSION_REQUIRED",
            kind: "unauthenticated",
        })
    })

    it("runs a free interview end to end: no feedback in between, one grading, the scorecard only after it, then the month's quota is spent", async () => {
        await runFreeInterview(doorsCase)
    })

    it("keeps a saved answer and moves on to the next authored question when the provider is down, and shows a session to its learner only", async () => {
        await runProviderDown(doorsCase)
    })

    it("fails the grading with a stable code when the model quotes words the learner never wrote, then keeps the transcript for a regrade", async () => {
        await runInventedQuote(doorsCase)
    })

    it("grades each question on its own rubric and quotes only from its own answer: a quote taken from another question's answer is refused", async () => {
        await runScopedQuotes(doorsCase)
    })
})
