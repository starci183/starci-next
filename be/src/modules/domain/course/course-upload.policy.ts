import { z } from "zod"
import {
    COURSE_HINT_LEVELS,
    type CourseCaseHintFacts,
    type CourseCaseResetFacts,
    type CourseCaseResultFacts,
} from "./course-lab.contracts"

const MESSAGE_MAX = 2000
const UP_TO_MAX = 50
const DURATION_MAX_MS = 2_000_000_000

const slug = z
    .string()
    .max(100)
    .regex(/^[a-z0-9][a-z0-9-]*$/u)

const instant = z.string().refine((text) => !Number.isNaN(Date.parse(text)))

const runStatus = z.enum(["green", "red", "error"])

const caseResult = z.strictObject({
    eventId: z.uuid(),
    lessonId: slug,
    caseId: slug,
    kind: z.enum(["happy", "unhappy"]),
    status: runStatus,
    ranAt: instant,
    durationMs: z.number().int().min(0).max(DURATION_MAX_MS),
    learnerCommit: z.string().regex(/^[0-9a-f]{40}$/u),
    chaos: z.record(z.string().min(1).max(100), z.union([z.string().max(MESSAGE_MAX), z.number(), z.boolean()])),
    upTo: z.array(z.strictObject({ caseId: slug, status: runStatus })).max(UP_TO_MAX),
    failed: z
        .strictObject({
            invariant: z.string().min(1).max(100),
            message: z.string().max(MESSAGE_MAX),
            expected: z.string().max(MESSAGE_MAX).optional(),
            actual: z.string().max(MESSAGE_MAX).optional(),
        })
        .optional(),
})

const caseHint = z.strictObject({
    lessonId: slug,
    caseId: slug,
    level: z.number().int().min(1).max(COURSE_HINT_LEVELS),
    at: instant,
})

const caseReset = z.strictObject({
    lessonId: slug,
    caseId: slug,
    stashedBranch: z.string().min(1).max(200),
    at: instant,
})

/** The case result a machine uploaded, when it is well formed: bounded text, a 40-hex commit, a client event id. A green run carries no failure. */
export const caseResultFactsOf = (value: unknown): CourseCaseResultFacts | null => {
    const parsed = caseResult.safeParse(value)
    if (!parsed.success) return null
    const facts: CourseCaseResultFacts = parsed.data
    return facts.status === "green" && facts.failed !== undefined ? null : facts
}

/** The hint upload a machine sent, when it is well formed. */
export const caseHintFactsOf = (value: unknown): CourseCaseHintFacts | null => {
    const parsed = caseHint.safeParse(value)
    return parsed.success ? parsed.data : null
}

/** The reset upload a machine sent, when it is well formed. */
export const caseResetFactsOf = (value: unknown): CourseCaseResetFacts | null => {
    const parsed = caseReset.safeParse(value)
    return parsed.success ? parsed.data : null
}
