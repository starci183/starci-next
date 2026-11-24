/** The rung a paired device asks for to show a case's reference diff. */
export interface GetCourseRungRequest {
    /** The learner the device token proved. */
    readonly learnerId: string
    /** The lesson id, a lowercase slug. */
    readonly lessonId: string
    /** The unhappy case whose diff is shown. */
    readonly caseId: string
    /** The rung asked for: the case's own tag or the one before it. */
    readonly tag: string
}

/** The reset a paired device asks for: the learner the token proved and the `case.reset` upload input, read with the relay protocol. */
export interface ResetCourseRungRequest {
    /** The learner the device token proved. */
    readonly learnerId: string
    /** The `relayLabCaseReset` input: the queue envelope (`eventId`, `taskId`) and the reset's fields. */
    readonly input: Readonly<Record<string, unknown>>
}
