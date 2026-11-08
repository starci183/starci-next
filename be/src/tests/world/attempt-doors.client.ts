import type { EntityManager } from "typeorm"
import { WRITTEN_ANSWER } from "../fixtures/builders/attempt.builder"
import { persistDemoLesson, persistPremium } from "../fixtures/builders/lesson.builder"
import type { Learner, SessionBody } from "../fixtures/builders/identity.builder"
import { identityDoors, type DoorsWorld, type IdentityDoors } from "./identity-doors.client"

/** The extensions a refusal carries. */
export interface ErrorExtensionsBody {
    readonly code: string
    readonly kind: string
}

/** One GraphQL error. */
export interface GraphqlErrorBody {
    readonly extensions: ErrorExtensionsBody
}

/** A GraphQL answer. */
export interface GraphqlBody<T> {
    readonly data?: T | null
    readonly errors?: ReadonlyArray<GraphqlErrorBody>
}

/** One option of a graded choice as the door answers it. */
export interface OptionResultBody {
    readonly optionId: string
    readonly isCorrect: boolean
    readonly selected: boolean
    readonly explanation: string
}

/** One criterion of a graded written answer as the door answers it. */
export interface CriterionBody {
    readonly criterionId: string
}

/** The result of an attempt as the door answers it. */
export interface AttemptResultBody {
    readonly correct: boolean | null
    readonly options: ReadonlyArray<OptionResultBody>
    readonly criteria: ReadonlyArray<CriterionBody>
}

/** An attempt as the door answers it. */
export interface AttemptBody {
    readonly attemptId: string
    readonly status: string
    readonly kind: string
    readonly phase: string
    readonly failureCode: string | null
    readonly result: AttemptResultBody | null
}

/** The answer of the submit door. */
export interface SubmitBody {
    readonly submitLessonAttempt: AttemptBody
}

/** The answer of the attempt door. */
export interface AttemptReadBody {
    readonly lessonAttempt: AttemptBody
}

/** The outcome levels as the progress door answers them. */
export interface ProgressOutcomeBody {
    readonly id: string
    readonly understood: number
    readonly proved: number
}

/** The attempt counts as the progress door answers them. */
export interface ProgressAttemptsBody {
    readonly total: number
    readonly graded: number
    readonly failed: number
}

/** The newest attempt of an activity as the progress door answers it. */
export interface ProgressActivityBody {
    readonly activityId: string
    readonly latestStatus: string
}

/** The progress of a learner in a lesson as the door answers it. */
export interface LessonProgressBody {
    readonly version: string | null
    readonly phase: string
    readonly outcomes: ReadonlyArray<ProgressOutcomeBody>
    readonly attempts: ProgressAttemptsBody
    readonly activities: ReadonlyArray<ProgressActivityBody>
}

/** The answer of the progress door. */
export interface ProgressBody {
    readonly lessonProgress: LessonProgressBody
}

const ATTEMPT_FIELDS = `attemptId status kind phase failureCode
  result { correct options { optionId isCorrect selected explanation } criteria { criterionId } }`

/** The submit mutation. */
export const SUBMIT: string = `mutation Submit($input: SubmitLessonAttemptInput!) {
  submitLessonAttempt(input: $input) { ${ATTEMPT_FIELDS} }
}`

/** The attempt query. */
export const ATTEMPT: string = `query Attempt($input: LessonAttemptInput!) {
  lessonAttempt(input: $input) { ${ATTEMPT_FIELDS} }
}`

/** The progress query. */
export const PROGRESS: string = `query Progress($input: LessonProgressInput!) {
  lessonProgress(input: $input) {
    version phase
    outcomes { id understood proved }
    attempts { total graded failed }
    activities { activityId latestStatus }
  }
}`

/** The answer of a choice as the door reads it. */
export interface ChoiceAnswerInput {
    readonly optionId: string
}

/** The input of a submit to the choice of the demo lesson. */
export interface ChoiceSubmitInput {
    readonly lessonId: string
    readonly version: string
    readonly activityId: string
    readonly revision: number
    readonly answer: ChoiceAnswerInput
}

/** The answer of a written activity as the door reads it. */
export interface WrittenAnswerInput {
    readonly text: string
}

/** The input of a submit of a written answer. */
export interface WrittenSubmitInput {
    readonly lessonId: string
    readonly version: string
    readonly activityId: string
    readonly revision: number
    readonly locale: string
    readonly answer: WrittenAnswerInput
}

/** The input of a submit to the choice of the demo lesson. */
export const choiceInput = (optionId: string, revision = 1): ChoiceSubmitInput => ({
    lessonId: "demo-lesson",
    version: "v1",
    activityId: "demo--predict",
    revision,
    answer: { optionId },
})

/** The input of a submit of a written answer to an activity of the demo lesson. */
export const writtenInput = (activityId: string): WrittenSubmitInput => ({
    lessonId: "demo-lesson",
    version: "v1",
    activityId,
    revision: 1,
    locale: "en",
    answer: { text: WRITTEN_ANSWER },
})

/** A learner signed in over the doors. */
export interface SignedIn {
    readonly cookie: string
    readonly subject: string
}

/** What a spec of the attempt doors drives: the real core app behind the real session guard. */
export interface AttemptDoors {
    /** Sends one GraphQL operation with the session cookie, when there is one. */
    ask<T>(query: string, variables: object, cookie?: string): Promise<GraphqlBody<T>>
    /** Signs a new learner in, with Premium when asked. */
    signIn(learner: Learner, premium: boolean): Promise<SignedIn>
    /** Clears the rate windows and the mailbox, then stores the demo lesson. */
    reset(): Promise<void>
    /** The primary database. */
    db(): EntityManager | undefined
}

/** Drives the attempt doors of a booted core app. */
export const attemptDoors = (world: DoorsWorld): AttemptDoors => {
    const doors = (): IdentityDoors => identityDoors(world)
    return {
        ask: async <T>(query: string, variables: object, cookie?: string) =>
            (
                await doors().post<GraphqlBody<T>>(
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
        reset: async () => {
            await doors().reset()
            await persistDemoLesson(world.db.primary)
        },
        db: () => world.db.primary,
    }
}
