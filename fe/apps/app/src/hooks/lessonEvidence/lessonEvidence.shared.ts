/** The key under which an apply evidence keeps one of its two fields. */
export const evidenceKeyOf = (activityId: string, field: "output" | "explanation"): string => `${activityId}#${field}`

/** The first heading of an apply evidence's answer text. */
const OUTPUT_HEADING = "## Test output"

/** The second heading of an apply evidence's answer text. */
const EXPLANATION_HEADING = "## Explanation"

/** The answer text of an apply evidence: the red test output and the explanation as two headed parts. */
export const evidenceTextOf = (output: string, explanation: string): string =>
    [OUTPUT_HEADING, "", output, "", EXPLANATION_HEADING, "", explanation].join("\n")

/** The two fields an apply evidence's saved answer text holds; both empty for a text that is not one. */
export const evidenceFieldsOf = (text: string): { readonly output: string; readonly explanation: string } => {
    const [head = "", tail = ""] = text.split(`\n\n${EXPLANATION_HEADING}\n\n`)
    return {
        output: head.startsWith(`${OUTPUT_HEADING}\n\n`) ? head.slice(OUTPUT_HEADING.length + 2) : "",
        explanation: tail,
    }
}
