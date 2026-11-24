import { z } from "zod"

/**
 * The lab case events of the relay protocol: what the learner's relay reports about the ladder cases of a lab@2 lab, shared by both
 * ends so they can never drift. The relay CLI (`be/src/modules/integrations/relay-client`) builds and uploads them; the core's relay
 * door (`be/src/modules/domain/relay`, `be/src/features/api/relay-feed`) validates and stores them with the same schemas.
 *
 * Three events:
 * - `case.result`: one case was run (with every case before it); its status, the cases it ran up to, and why it failed.
 * - `case.hint`: the learner opened a hint level of a case (levels open in order; the count goes with a submission).
 * - `case.reset`: the learner, stuck, reset the learner file to the case's reference rung; their own work was kept on a branch.
 *
 * On the wire each event is the `input` of one upload mutation (`CASE_EVENT_MUTATIONS`), through the relay's offline upload queue,
 * with the queue's envelope: `eventId` (a client UUID, so a resend never counts twice) and `taskId` (`course:<course>/<lesson>`).
 * GraphQL has no map type here, so `chaos` travels as a list of `{ key, value }` (`caseEventInputOf`, `caseEventOfInput`).
 */

/** A slug id: a lesson, a case or an invariant. */
const SLUG = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/u)

/** An ISO 8601 instant in UTC, as `Date.prototype.toISOString` writes it. */
const INSTANT = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/u)

/** A chaos switch name (`STOCK_OUT`) and its value as text (`on`, `after:payments.charge`). */
const CHAOS_KEY = z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/u)
const CHAOS_VALUE = z.string().max(200)

/** How far one case got: green (every test of it passed), red (a test failed), error (it could not be judged: no report, no test). */
export const CASE_STATUSES = ["green", "red", "error"] as const

/** The status of a case in a `case.result`. */
export type CaseStatus = (typeof CASE_STATUSES)[number]

/** Happy cases pass from the first rung; unhappy cases are the ones the learner fixes. */
export const CASE_KINDS = ["happy", "unhappy"] as const

/** The kind of a case. */
export type CaseKind = (typeof CASE_KINDS)[number]

/** The longest failure message a result carries; the rest of a stack trace teaches nothing on the lesson page. */
export const CASE_MESSAGE_MAX = 1000

/** The longest expected or actual value a result carries. */
export const CASE_VALUE_MAX = 300

/** Why a case failed: the invariant that broke and the assertion's words. */
export const CASE_FAILURE = z.object({
    invariant: SLUG.nullable(),
    message: z.string().max(CASE_MESSAGE_MAX),
    expected: z.string().max(CASE_VALUE_MAX).optional(),
    actual: z.string().max(CASE_VALUE_MAX).optional(),
})

/** `case.result`: one run of a case and every case before it. */
export const CASE_RESULT_EVENT = z.object({
    type: z.literal("case.result"),
    lessonId: SLUG,
    caseId: SLUG,
    kind: z.enum(CASE_KINDS),
    status: z.enum(CASE_STATUSES),
    ranAt: INSTANT,
    durationMs: z.number().int().min(0).max(86_400_000),
    /** The commit the learner's checkout stood on (40 hex), or null when git did not say (a learner may run before committing). */
    learnerCommit: z
        .string()
        .regex(/^[0-9a-f]{40}$/u)
        .nullable(),
    /** The chaos switches the case runs under, from the lab manifest. */
    chaos: z.record(CHAOS_KEY, CHAOS_VALUE),
    /** Every case the run covered, in teaching order, the asked case last. */
    upTo: z.array(z.object({ caseId: SLUG, status: z.enum(CASE_STATUSES) })).min(1).max(100),
    /** Present exactly when the status is not green. */
    failed: CASE_FAILURE.optional(),
})

/** `case.hint`: one hint level opened. */
export const CASE_HINT_EVENT = z.object({
    type: z.literal("case.hint"),
    lessonId: SLUG,
    caseId: SLUG,
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    at: INSTANT,
})

/** The prefix of the branch a reset keeps the learner's own work on. */
export const CASE_STASH_BRANCH_PREFIX = "cua-toi-luu-"

/** `case.reset`: the learner file was reset to a case's reference rung; `stashedBranch` holds the learner's own attempt. */
export const CASE_RESET_EVENT = z.object({
    type: z.literal("case.reset"),
    lessonId: SLUG,
    caseId: SLUG,
    stashedBranch: z
        .string()
        .regex(new RegExp(`^${CASE_STASH_BRANCH_PREFIX}[a-z0-9][a-z0-9-]{0,80}$`, "u")),
    at: INSTANT,
})

/** Any lab case event. */
export const CASE_EVENT = z.discriminatedUnion("type", [CASE_RESULT_EVENT, CASE_HINT_EVENT, CASE_RESET_EVENT])

/** A `case.result` event. */
export type CaseResultEvent = z.infer<typeof CASE_RESULT_EVENT>
/** A `case.hint` event. */
export type CaseHintEvent = z.infer<typeof CASE_HINT_EVENT>
/** A `case.reset` event. */
export type CaseResetEvent = z.infer<typeof CASE_RESET_EVENT>
/** Any lab case event. */
export type CaseEvent = z.infer<typeof CASE_EVENT>
/** The type tag of a case event. */
export type CaseEventType = CaseEvent["type"]

/** The upload mutation of each event type: the core door's names, and the relay's offline queue's. */
export const CASE_EVENT_MUTATIONS = {
    "case.result": "relayLabCaseResult",
    "case.hint": "relayLabCaseHint",
    "case.reset": "relayLabCaseReset",
} as const satisfies Readonly<Record<CaseEventType, string>>

/** The name of a case upload mutation. */
export type CaseEventMutation = (typeof CASE_EVENT_MUTATIONS)[CaseEventType]

/** The GraphQL input type of each case upload mutation. */
export const CASE_EVENT_INPUT_TYPES = {
    relayLabCaseResult: "RelayLabCaseResultInput",
    relayLabCaseHint: "RelayLabCaseHintInput",
    relayLabCaseReset: "RelayLabCaseResetInput",
} as const satisfies Readonly<Record<CaseEventMutation, string>>

/** The task id of a lab's uploads, the same one the lab's signed manifests carry: `course:<course>/<lesson>`. */
export const caseTaskIdOf = (courseId: string, lessonId: string): string => `course:${courseId}/${lessonId}`

/** One chaos switch on the wire. */
export interface WireChaos {
    readonly key: string
    readonly value: string
}

/** The upload input of an event: the queue envelope plus the event, `type` dropped (the mutation names it), `chaos` as a list. */
export type CaseEventInput = Readonly<Record<string, unknown>> & { readonly eventId: string; readonly taskId: string }

/** The mutation and the input that carry an event; `eventId` keeps a resend from counting twice. */
export const caseEventInputOf = (
    event: CaseEvent,
    envelope: { readonly eventId: string; readonly taskId: string },
): { readonly mutation: CaseEventMutation; readonly input: CaseEventInput } => {
    const { type, ...fields } = event
    const wire =
        "chaos" in fields
            ? {
                  ...fields,
                  chaos: Object.entries(fields.chaos).map(([key, value]): WireChaos => ({ key, value })),
              }
            : fields
    return { mutation: CASE_EVENT_MUTATIONS[type], input: { ...envelope, ...wire } }
}

/** What reading an upload back into an event came to. */
export type CaseEventRead =
    | { readonly kind: "event"; readonly event: CaseEvent; readonly eventId: string; readonly taskId: string }
    | { readonly kind: "invalid"; readonly problems: ReadonlyArray<string> }

/**
 * The event an upload input carries, checked with the event's schema: the door's side of `caseEventInputOf`. Unknown fields are
 * refused rather than dropped, so a relay and a door that disagree about the protocol fail loudly instead of losing a field.
 */
export const caseEventOfInput = (mutation: CaseEventMutation, input: Readonly<Record<string, unknown>>): CaseEventRead => {
    const type = (Object.keys(CASE_EVENT_MUTATIONS) as ReadonlyArray<CaseEventType>).find(
        (key) => CASE_EVENT_MUTATIONS[key] === mutation,
    )
    const { eventId, taskId, chaos, ...rest } = input
    if (type === undefined || typeof eventId !== "string" || typeof taskId !== "string")
        return { kind: "invalid", problems: ["an upload needs a known mutation, an eventId and a taskId"] }
    const chaosRecord = Array.isArray(chaos)
        ? Object.fromEntries(
              (chaos as ReadonlyArray<unknown>).map((item) =>
                  typeof item === "object" && item !== null && "key" in item && "value" in item
                      ? [String(item.key), String(item.value)]
                      : ["", ""],
              ),
          )
        : chaos
    const candidate = { type, ...rest, ...(chaos === undefined ? {} : { chaos: chaosRecord }) }
    const schema = type === "case.result" ? CASE_RESULT_EVENT : type === "case.hint" ? CASE_HINT_EVENT : CASE_RESET_EVENT
    const checked = schema.strict().safeParse(candidate)
    return checked.success
        ? { kind: "event", event: checked.data, eventId, taskId }
        : { kind: "invalid", problems: checked.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) }
}
