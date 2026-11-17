/** The words of the evidence card, resolved by its block. */
export type ApplyEvidenceLabels = {
    /** Label of the field for the red test output. */
    readonly output: string
    /** The line under it: what to paste. */
    readonly outputHint: string
    /** Label of the explanation field. */
    readonly explanation: string
    readonly explanationHint: string
    readonly submit: string
    readonly retry: string
    readonly pending: string
    readonly saved: string
    readonly grading: string
    /** Said when the evidence is saved but its grading failed. */
    readonly failedSaved: string
    readonly error: string
    readonly premium: string
    readonly plans: string
    /** Heading of the result card. */
    readonly result: string
    /** The words for level 0, 1 and 2 of a graded criterion. */
    readonly levels: readonly [string, string, string]
    /** The prefix of the missing line; the card draws `<missing>: <text>`. */
    readonly missing: string
    /** The saved-at line; `{time}` is replaced by the `savedAt` of the result. */
    readonly savedAt: string
}

/** Where the attempt stands. */
export type EvidenceStatus = "idle" | "pending" | "saved" | "grading" | "graded" | "failed" | "premium"

/** One graded criterion of the evidence. */
export type EvidenceCriterion = {
    readonly id: string
    readonly criterion: string
    /** 0, 1 or 2. */
    readonly level: number
    /** What the answer lacks; empty for a full level (no missing line is drawn). */
    readonly missing: string
}

/** The grade, once there is one. */
export type EvidenceResult = {
    /** The score line, e.g. "5/6". */
    readonly scoreLine: string
    /** The time it was saved, already formatted HH:mm. */
    readonly savedAt: string
    readonly criteria: ReadonlyArray<EvidenceCriterion>
}

/** The evidence of one exercise: what the task asks, the red test output, the explanation, and the grade. */
export type ApplyEvidenceProps = {
    /** The task text of the exercise. */
    readonly task: string
    readonly outputValue: string
    readonly explanationValue: string
    readonly status: EvidenceStatus
    /** True when the last send was rejected by the transport. */
    readonly isSendFailed: boolean
    /** `limit` (the daily grading allowance is used up) disables the submit. */
    readonly issue?: "none" | "unconfigured" | "limit" | "other"
    /** Absent before a grade; the result card is drawn only with it. */
    readonly result?: EvidenceResult
    readonly labels: ApplyEvidenceLabels
    /** The destination of the plans page, shown when the attempt asks for Premium. */
    readonly plansHref: string
    readonly onOutputChange: (text: string) => void
    readonly onExplanationChange: (text: string) => void
    readonly onSubmit: () => void
}
