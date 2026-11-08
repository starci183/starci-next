import { SystemClockService } from "@modules/platform/clock"
import { sql } from "@modules/platform/database"
import {
    SESSION_COOKIE,
    SESSION_DELETED,
    learnersOf,
    type ChallengeBody,
    type RefusalBody,
    type SessionBody,
} from "../../fixtures/builders/identity.builder"
import { SECRET, persistDemoTopic } from "../../fixtures/builders/lesson.builder"
import { MONTHLY, YEARLY, FORGED_KEY } from "../../fixtures/builders/premium.builder"
import { useAiCoachWorld, type AiCoachWorld } from "../../world/ai-coach-world.options"
import { attemptDoors, type AttemptDoors, type GraphqlBody } from "../../world/attempt-doors.client"
import { identityDoors, type IdentityDoors } from "../../world/identity-doors.client"
import { SEPAY_IPN_SECRET } from "../../world/test-apps.options"
import { useTestWorld } from "../../world/use-test-world"

/** One activity of a lesson section. */
interface ActivityRef {
    readonly id: string
}

/** One lesson of the catalog. */
interface LessonRef {
    readonly id: string
}

interface LessonsData {
    readonly lessons: ReadonlyArray<LessonRef>
}

interface SectionBody {
    readonly phase: string
    readonly locked: boolean
    readonly body: string | null
    readonly activities: ReadonlyArray<ActivityRef>
}

interface LessonBody {
    readonly isPremium: boolean
    readonly sections: ReadonlyArray<SectionBody>
}

interface LessonData {
    readonly lesson: LessonBody
}

interface OptionResult {
    readonly isCorrect: boolean
    readonly selected: boolean
    readonly explanation: string
}

interface CriterionResult {
    readonly criterionId: string
    readonly level: number
    readonly evidenceQuote: string
}

interface AttemptResult {
    readonly correct: boolean | null
    readonly options: ReadonlyArray<OptionResult>
    readonly criteria: ReadonlyArray<CriterionResult>
}

interface AttemptBody {
    readonly attemptId: string
    readonly status: string
    readonly kind: string
    readonly phase: string
    readonly failureCode: string | null
    readonly result: AttemptResult | null
}

interface SubmitData {
    readonly submitLessonAttempt: AttemptBody
}

interface AttemptCounts {
    readonly total: number
    readonly graded: number
}

interface ActivityStatus {
    readonly activityId: string
    readonly latestStatus: string
}

interface LessonProgress {
    readonly attempts: AttemptCounts
    readonly activities: ReadonlyArray<ActivityStatus>
}

interface ProgressData {
    readonly lessonProgress: LessonProgress
}

interface OrderBody {
    readonly orderId: string
    readonly status: string
    readonly premiumUntil: string | null
}

interface OrderData {
    readonly premiumOrder: OrderBody
}

interface StartedOrder {
    readonly orderId: string
    readonly rail: string
}

interface StartData {
    readonly startPremiumCheckout: StartedOrder
}

interface PremiumBody {
    readonly isPremium: boolean
    readonly premiumUntil: string | null
    readonly lastRail: string | null
}

interface MineData {
    readonly myPremium: PremiumBody
}

interface PremiumUntilRow {
    readonly premium_until: Date
}

interface OrderCodeRow {
    readonly order_code: string
}

interface PurchaseRow {
    readonly status: string
    readonly amount_vnd: number
}

interface AttemptRow {
    readonly activity_id: string
    readonly phase: string
    readonly status: string
}

/** An order the learner started and the code the rail knows it by. */
interface BoughtOrder {
    readonly orderId: string
    readonly orderCode: string
}

/** The session the single learner of the journey carries from step to step. */
interface JourneyState {
    cookie: string
    subject: string
    firstEnd: number
}

/** The booted world as the journey drives it. */
type JourneyWorld = ReturnType<typeof useTestWorld>

/** What every step of the journey shares: the world, the learner state and the doors. */
interface Journey {
    readonly world: JourneyWorld
    readonly state: JourneyState
    readonly coach: AiCoachWorld
    readonly doors: () => IdentityDoors
    readonly ask: AttemptDoors["ask"]
}

const LESSONS = `query ($input: LessonsInput!) { lessons(input: $input) { id title } }`
const LESSON = `query ($input: LessonInput!) { lesson(input: $input) { id isPremium sections { phase locked body activities { id } } } }`
const SUBMIT = `mutation ($input: SubmitLessonAttemptInput!) { submitLessonAttempt(input: $input) {
  attemptId status kind phase failureCode
  result { correct options { isCorrect selected explanation } criteria { criterionId level evidenceQuote } } } }`
const PROGRESS = `query ($input: LessonProgressInput!) { lessonProgress(input: $input) {
  phase attempts { total graded failed } activities { activityId latestStatus } } }`
const START = `mutation ($input: StartPremiumCheckoutInput!) { startPremiumCheckout(input: $input) { orderId rail } }`
const ORDER = `query ($input: PremiumOrderInput!) { premiumOrder(input: $input) { orderId status premiumUntil } }`
const MINE = `query { myPremium { isPremium premiumUntil lastRail } }`

const PURCHASE = sql`SELECT order_code, status, plan, amount_vnd FROM purchases WHERE purchase_id = $1::uuid`
const ENTITLEMENT = sql`SELECT premium_until FROM entitlements WHERE learner_id = $1::uuid`
const ATTEMPT_ROWS = sql`SELECT activity_id, phase, status FROM lesson_attempts WHERE learner_id = $1::uuid ORDER BY activity_id, revision`

const DAY_MS = 86_400_000

const codeOf = (reply: GraphqlBody<unknown>): string | undefined => reply.errors?.[0]?.extensions.code

const premiumUntilOf = async (journey: Journey): Promise<number> => {
    const rows =
        (await journey.world.db.primary?.query<Array<PremiumUntilRow>>(ENTITLEMENT, [journey.state.subject])) ?? []
    return rows[0]?.premium_until.getTime() ?? 0
}

const attemptRowsOf = async (journey: Journey): Promise<Array<AttemptRow>> =>
    (await journey.world.db.primary?.query<Array<AttemptRow>>(ATTEMPT_ROWS, [journey.state.subject])) ?? []

/** A paid IPN in VND for the exact amount, carrying the status and currency fields SePay sends. */
const deliverIpn = (journey: Journey, orderCode: string, amount: number, transaction: string, secret: string) =>
    journey.world.apps.core?.api.post(
        "/webhooks/sepay",
        {
            timestamp: 1_790_000_000,
            notification_type: "ORDER_PAID",
            order: {
                order_invoice_number: orderCode,
                order_amount: `${amount}.00`,
                order_currency: "VND",
                order_status: "CAPTURED",
            },
            transaction: { transaction_id: transaction, transaction_status: "APPROVED", transaction_currency: "VND" },
            customer: {},
        },
        { headers: { "x-secret-key": secret } },
    )

const buy = async (journey: Journey, plan: string): Promise<BoughtOrder> => {
    const started = await journey.ask<StartData>(START, { input: { plan, rail: "sepay" } })
    const orderId = started.data?.startPremiumCheckout.orderId ?? ""
    const rows = (await journey.world.db.primary?.query<Array<OrderCodeRow>>(PURCHASE, [orderId])) ?? []
    return { orderId, orderCode: rows[0]?.order_code ?? "" }
}

const statusOf = async (journey: Journey, orderId: string): Promise<string | undefined> =>
    (await journey.ask<OrderData>(ORDER, { input: { orderId } })).data?.premiumOrder.status

const signUpCase = (journey: Journey): void => {
    const learner = learnersOf("e1")()
    it("signs up with email and password, reads the six-digit code from the mailbox and gets the session cookie", async () => {
        const doors = journey.doors()
        const opened = await doors.post<ChallengeBody>("/api/identity/sign-up", {
            email: learner.email,
            password: learner.password,
            username: learner.username,
            acceptTerms: true,
        })
        const code = await doors.codeSentTo(learner.email)
        const verified = await doors.post("/api/identity/sign-up/verify", { challenge: opened.body.challenge, code })
        const setCookie = verified.headers["set-cookie"] ?? ""
        journey.state.cookie = setCookie.split(";")[0] ?? ""
        const session = await doors.get<SessionBody>("/api/identity/session", { cookie: journey.state.cookie })
        journey.state.subject = session.body.identity.subject
        const active = await doors.activeSessions()

        expect(code).toMatch(/^\d{6}$/u)
        expect(verified.status).toBe(204)
        expect(setCookie).toMatch(SESSION_COOKIE)
        expect(journey.state.cookie.startsWith("__Host-identity_session=")).toBe(true)
        expect(session.status).toBe(200)
        expect(active).toBeGreaterThanOrEqual(1)
    })
}

const freeLearnerCases = (journey: Journey): void => {
    it("lists the lessons for the free learner and opens the challenge phase while every other phase stays locked", async () => {
        const list = await journey.ask<LessonsData>(LESSONS, { input: { locale: "en" } })
        const opened = await journey.ask<LessonData>(LESSON, { input: { id: "demo-lesson", locale: "en" } })
        const sections = opened.data?.lesson.sections ?? []

        expect(list.data?.lessons.map((item) => item.id)).toContain("demo-lesson")
        expect(opened.data?.lesson.isPremium).toBe(false)
        expect(sections.map((section) => [section.phase, section.locked])).toEqual([
            ["challenge", false],
            ["predict", true],
            ["explore", true],
            ["explain", true],
            ["apply", true],
            ["reflect", true],
        ])
        expect(sections.filter((section) => section.locked).every((section) => section.body === null)).toBe(true)
        expect(JSON.stringify(opened)).not.toContain(SECRET)
    })

    it("refuses a predict-phase submit with LESSON_PREMIUM_REQUIRED and stores no attempt, then lets the challenge phase submit", async () => {
        const predict = await journey.ask<SubmitData>(SUBMIT, {
            input: {
                lessonId: "demo-lesson",
                version: "v1",
                activityId: "demo--predict",
                revision: 1,
                answer: { optionId: "demo--predict--1" },
            },
        })
        const challenge = await journey.ask<SubmitData>(SUBMIT, {
            input: {
                lessonId: "demo-lesson",
                version: "v1",
                activityId: "demo--interview",
                revision: 1,
                locale: "en",
                answer: { text: "A read model goes stale because the projection runs after the write." },
            },
        })
        const rows = await attemptRowsOf(journey)

        expect(codeOf(predict)).toBe("LESSON_PREMIUM_REQUIRED")
        expect(JSON.stringify(predict)).not.toContain(SECRET)
        expect(codeOf(challenge)).toBeUndefined()
        expect(challenge.data?.submitLessonAttempt).toMatchObject({ kind: "explain", phase: "challenge" })
        expect(rows.map((row) => row.phase)).toEqual(["challenge"])
    })
}

const checkoutCases = (journey: Journey): void => {
    const clock = new SystemClockService()

    it("starts a monthly SePay checkout as a verifying order, and a forged or unsigned IPN grants nothing", async () => {
        const { orderId, orderCode } = await buy(journey, "monthly")
        const rows = (await journey.world.db.primary?.query<Array<PurchaseRow>>(PURCHASE, [orderId])) ?? []

        const forged = await deliverIpn(journey, orderCode, MONTHLY, "tx-forged", FORGED_KEY)
        const mine = await journey.ask<MineData>(MINE, {}, journey.state.cookie)

        expect(orderCode).not.toBe("")
        expect(rows[0]).toMatchObject({ status: "pending", amount_vnd: MONTHLY })
        expect(await statusOf(journey, orderId)).toBe("verifying")
        expect(forged?.status).toBeGreaterThanOrEqual(400)
        expect(forged?.status).toBeLessThan(500)
        expect(await statusOf(journey, orderId)).toBe("verifying")
        expect(mine.data?.myPremium.isPremium).toBe(false)
        expect(await premiumUntilOf(journey)).toBe(0)
    })

    it("activates the order on a correctly signed IPN and grants about one month, once however often it is redelivered", async () => {
        const { orderId, orderCode } = await buy(journey, "monthly")

        const first = await deliverIpn(journey, orderCode, MONTHLY, "tx-monthly", SEPAY_IPN_SECRET)
        const granted = await premiumUntilOf(journey)
        const duplicate = await deliverIpn(journey, orderCode, MONTHLY, "tx-monthly", SEPAY_IPN_SECRET)
        const order = await journey.ask<OrderData>(ORDER, { input: { orderId } })
        const mine = await journey.ask<MineData>(MINE, {}, journey.state.cookie)
        journey.state.firstEnd = granted
        const days = (granted - clock.now().getTime()) / DAY_MS

        expect(first?.status).toBeLessThan(300)
        expect(duplicate?.status).toBeLessThan(300)
        expect(await premiumUntilOf(journey)).toBe(granted)
        expect(order.data?.premiumOrder.status).toBe("active")
        expect(mine.data?.myPremium).toMatchObject({ isPremium: true, lastRail: "sepay" })
        expect(new Date(mine.data?.myPremium.premiumUntil ?? 0).getTime()).toBe(granted)
        expect(days).toBeGreaterThan(27)
        expect(days).toBeLessThan(32)
    })

    it("extends from the current end when yearly is bought while Premium is active", async () => {
        const { orderId, orderCode } = await buy(journey, "yearly")

        await deliverIpn(journey, orderCode, YEARLY, "tx-yearly", SEPAY_IPN_SECRET)
        const extended = await premiumUntilOf(journey)
        const years = (extended - journey.state.firstEnd) / DAY_MS

        expect(await statusOf(journey, orderId)).toBe("active")
        expect(years).toBeGreaterThanOrEqual(365)
        expect(years).toBeLessThanOrEqual(366)
    })
}

const premiumLearnerCases = (journey: Journey): void => {
    it("grades a predict-phase choice with every explanation for Premium and reflects it in the lesson progress", async () => {
        const opened = await journey.ask<LessonData>(LESSON, { input: { id: "demo-lesson", locale: "en" } })
        const submitted = await journey.ask<SubmitData>(SUBMIT, {
            input: {
                lessonId: "demo-lesson",
                version: "v1",
                activityId: "demo--predict",
                revision: 1,
                answer: { optionId: "demo--predict--2" },
            },
        })
        const attempt = submitted.data?.submitLessonAttempt
        const progress = await journey.ask<ProgressData>(PROGRESS, { input: { lessonId: "demo-lesson" } })
        const rows = await attemptRowsOf(journey)

        expect(opened.data?.lesson.isPremium).toBe(true)
        expect(opened.data?.lesson.sections.every((section) => !section.locked)).toBe(true)
        expect(attempt).toMatchObject({ kind: "choice", phase: "predict", status: "graded", failureCode: null })
        expect(attempt?.result?.correct).toBe(false)
        expect(
            attempt?.result?.options.map((option) => [option.isCorrect, option.selected, option.explanation]),
        ).toEqual([
            [true, false, `${SECRET} right`],
            [false, true, `${SECRET} wrong`],
            [false, false, `${SECRET} also wrong`],
        ])
        expect(progress.data?.lessonProgress.attempts.graded).toBeGreaterThanOrEqual(1)
        expect(progress.data?.lessonProgress.activities).toContainEqual({
            activityId: "demo--predict",
            latestStatus: "graded",
        })
        expect(rows).toContainEqual(expect.objectContaining({ activity_id: "demo--predict", status: "graded" }))
    })

    it("grades a Premium explain-phase written answer per criterion through the coach, with levels and quotes and no expected evidence", async () => {
        const text = "The projection lags the write, so the read model shows the old name until it catches up."
        await journey.coach.openrouter()?.reply(
            JSON.stringify({
                criteria: [
                    { criterionId: "demo--final--c1", level: 2, evidenceQuote: "The projection lags the write" },
                    { criterionId: "demo--final--c2", level: 1, evidenceQuote: "shows the old name" },
                ],
            }),
        )

        const submitted = await journey.ask<SubmitData>(SUBMIT, {
            input: {
                lessonId: "demo-lesson",
                version: "v1",
                activityId: "demo--final",
                revision: 1,
                locale: "en",
                answer: { text },
            },
        })
        const attempt = submitted.data?.submitLessonAttempt
        const rows = await attemptRowsOf(journey)

        expect(submitted.errors).toBeUndefined()
        expect(attempt).toMatchObject({ kind: "explain", phase: "reflect", status: "graded", failureCode: null })
        expect(attempt?.result?.criteria.map((entry) => [entry.criterionId, entry.level, entry.evidenceQuote])).toEqual(
            [
                ["demo--final--c1", 2, "The projection lags the write"],
                ["demo--final--c2", 1, "shows the old name"],
            ],
        )
        expect(JSON.stringify(submitted)).not.toMatch(/expectedEvidence|misconception|sampleAnswer/u)
        expect(JSON.stringify(submitted)).not.toContain(SECRET)
        expect(rows).toContainEqual(expect.objectContaining({ activity_id: "demo--final", status: "graded" }))
    })
}

const signOutCase = (journey: Journey): void => {
    it("signs out, after which the session door answers 401 IDENTITY_SESSION_REQUIRED", async () => {
        const { cookie } = journey.state
        const out = await journey.doors().post("/api/identity/session/sign-out", undefined, { cookie })
        const after = await journey.doors().get<RefusalBody>("/api/identity/session", { cookie })
        const graphql = await journey.ask<MineData>(MINE, {}, cookie)

        expect([out.status, out.headers["set-cookie"]]).toEqual([204, SESSION_DELETED])
        expect([after.status, after.body.code]).toEqual([401, "IDENTITY_SESSION_REQUIRED"])
        expect(codeOf(graphql)).toBe("IDENTITY_SESSION_REQUIRED")
    })
}

/**
 * The main learner journey through the real core app over HTTP and GraphQL: sign up with the emailed code, learn as a free
 * learner, buy Premium through SePay, learn as Premium, sign out. One learner walks every step, so each step starts from the
 * state the step before left.
 */
describe("learner journey (e2e)", () => {
    const world = useTestWorld({ apps: ["core"] })
    const coach = useAiCoachWorld(world)
    const state: JourneyState = { cookie: "", subject: "", firstEnd: 0 }
    const gql = attemptDoors(world)
    const journey: Journey = {
        world,
        state,
        coach,
        doors: () => identityDoors(world),
        ask: (query, variables, as) => gql.ask(query, variables, as ?? state.cookie),
    }

    beforeAll(async () => {
        await persistDemoTopic(world.db.primary)
    })

    signUpCase(journey)
    freeLearnerCases(journey)
    checkoutCases(journey)
    premiumLearnerCases(journey)
    signOutCase(journey)
})
