import type { EntityManager } from "typeorm"
import { sql } from "@modules/platform/database"
import { eachInOrder } from "@modules/platform/primitives"
import { persistPremium } from "../fixtures/builders/lesson.builder"
import { persistPracticeProblems, type StoredProblem } from "../fixtures/builders/practice.builder"
import type { Learner, SessionBody } from "../fixtures/builders/identity.builder"
import { identityDoors, type DoorsWorld, type IdentityDoors } from "./identity-doors.client"

/** The stable code and platform kind of an error. */
export interface PracticeErrorExtensions {
    readonly code: string
    readonly kind: string
}

/** One GraphQL error as a spec reads it. */
export interface PracticeErrorBody {
    readonly message?: string
    readonly extensions: PracticeErrorExtensions
}

/** A GraphQL answer. */
export interface PracticeGraphqlBody<T> {
    readonly data?: T | null
    readonly errors?: ReadonlyArray<PracticeErrorBody>
}

/** One test of a judged submission as the door answers it. */
export interface PracticeTestBody {
    readonly index: number
    readonly passed: boolean
    readonly status: string
    readonly example: { readonly input: string; readonly expected: string; readonly actual: string } | null
}

/** A submission as the door answers it. */
export interface PracticeSubmissionBody {
    readonly id: string
    readonly kind: string
    readonly verdict: string
    readonly compileOutput: string | null
    readonly failureCode: string | null
    readonly passedCount: number
    readonly totalCount: number
    readonly tests: ReadonlyArray<PracticeTestBody>
}

/** The pattern row of the pattern list. */
export interface PracticePatternBody {
    readonly patternId: string
    readonly problemCount: number
    readonly acceptedCount: number
    readonly freeCount: number
    readonly locked: boolean
}

/** The problem row of a pattern. */
export interface PracticeProblemRowBody {
    readonly slug: string
    readonly status: string
    readonly locked: boolean
}

/** One hint as the door answers it. */
export interface PracticeHintBody {
    readonly step: number
    readonly title: string
    readonly markdown: string
}

/** The problem as the door answers it. */
export interface PracticeProblemBody {
    readonly slug: string
    readonly locked: boolean
    readonly hintsTotal: number
    readonly hintsRevealed: ReadonlyArray<PracticeHintBody>
    readonly starterCodes: ReadonlyArray<{ readonly language: string; readonly content: string }>
    readonly examples: ReadonlyArray<{ readonly input: string; readonly output: string }>
}

const SUBMISSION_FIELDS = `id kind verdict compileOutput failureCode passedCount totalCount
  tests { index passed status example { input expected actual } }`

/** The pattern list query. */
export const PATTERNS: string = `query Patterns($input: PracticePatternsInput!) {
  practicePatterns(input: $input) { patternId problemCount acceptedCount freeCount locked }
}`

/** The problem list query of a pattern. */
export const PROBLEMS: string = `query Problems($input: PracticeProblemsInput!) {
  practiceProblems(input: $input) { slug status locked }
}`

/** The problem query. */
export const PROBLEM: string = `query Problem($input: PracticeProblemInput!) {
  practiceProblem(input: $input) {
    slug locked hintsTotal hintsRevealed { step title markdown }
    starterCodes { language content } examples { input output }
  }
}`

/** The readiness query. */
export const READINESS: string = `query Readiness($input: PracticeReadinessInput!) {
  practiceReadiness(input: $input) { patternId problemCount acceptedCount }
}`

/** The run mutation. */
export const RUN: string = `mutation Run($input: PracticeSolveInput!) { runPractice(input: $input) { ${SUBMISSION_FIELDS} } }`

/** The submit mutation. */
export const SUBMIT: string = `mutation Submit($input: PracticeSolveInput!) { submitPractice(input: $input) { ${SUBMISSION_FIELDS} } }`

/** The submission query. */
export const SUBMISSION: string = `query Submission($input: PracticeSubmissionInput!) {
  practiceSubmission(input: $input) { ${SUBMISSION_FIELDS} }
}`

/** The hint mutation. */
export const HINT: string = `mutation Hint($input: RevealPracticeHintInput!) {
  revealPracticeHint(input: $input) { step title markdown }
}`

/** The variables of a run or submit. */
export const solveInput = (slug: string, source: string, language = "PYTHON"): object => ({
    input: { slug, language, source },
})

const CLEAR = [
    sql`DELETE FROM practice_hint_reveals`,
    sql`DELETE FROM practice_submissions`,
    sql`DELETE FROM practice_problem_versions`,
]

const STORED_STREAK = sql`SELECT action_id, shard, kind FROM streak_actions WHERE learner_id = $1::uuid`

/** One streak action as stored. */
export interface StoredStreakRow {
    readonly action_id: string
    readonly shard: string
    readonly kind: string
}

/** A learner signed in over the doors. */
export interface PracticeSignedIn {
    readonly cookie: string
    readonly subject: string
}

/** What a spec of the practice doors drives: the real core app behind the real session guard and the Judge0 fake. */
export interface PracticeDoors {
    /** Sends one GraphQL operation with the session cookie, when there is one. */
    ask<T>(query: string, variables: object, cookie?: string): Promise<PracticeGraphqlBody<T>>
    /** Signs a new learner in, with Premium when asked. */
    signIn(learner: Learner, premium: boolean): Promise<PracticeSignedIn>
    /** Clears the rate windows, the mailbox, the judge fake and every practice row, then stores the problems. */
    reset(problems: ReadonlyArray<StoredProblem>): Promise<void>
    /** The streak actions the learner has, as stored. */
    streakActions(learnerId: string): Promise<ReadonlyArray<StoredStreakRow>>
    /** The primary database. */
    db(): EntityManager | undefined
}

/** The part of a booted world the practice doors need beyond the identity doors: the judge fake to forget its script. */
export interface PracticeDoorsWorld extends DoorsWorld {
    /** The fakes of the world. */
    readonly fake: DoorsWorld["fake"] & { readonly judge0?: { reset(): Promise<void> } | undefined }
}

/** Drives the practice doors of a booted core app. */
export const practiceDoors = (world: PracticeDoorsWorld): PracticeDoors => {
    const doors = (): IdentityDoors => identityDoors(world)
    return {
        ask: async <T>(query: string, variables: object, cookie?: string) =>
            (
                await doors().post<PracticeGraphqlBody<T>>(
                    "/graphql",
                    { query, variables },
                    cookie === undefined ? {} : { cookie },
                )
            ).body,
        signIn: async (learner, premium) => {
            const cookie = await doors().signIn(learner)
            const session = await doors().get<SessionBody>("/api/identity/session", { cookie })
            const subject = session.body.identity.subject
            if (premium) await persistPremium(world.db.primary, subject)
            return { cookie, subject }
        },
        reset: async (problems) => {
            await doors().reset()
            await world.fake.judge0?.reset()
            await eachInOrder(CLEAR, async (statement) => {
                await world.db.primary?.query(statement)
            })
            await persistPracticeProblems(world.db.primary, problems)
        },
        streakActions: async (learnerId) =>
            (await world.db.primary?.query<Array<StoredStreakRow>>(STORED_STREAK, [learnerId])) ?? [],
        db: () => world.db.primary,
    }
}
