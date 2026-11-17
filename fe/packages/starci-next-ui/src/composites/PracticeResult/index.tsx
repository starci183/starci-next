import { Alert, FencedCodeBlock, Section, Stack, type ListRowData } from "@starci/grammar/common"

/** The state a verdict is drawn in. */
export type PracticeVerdictTone = "informative" | "affirmative" | "negative" | "cautionary"

/** What an example test shows: its input, the expected output and what the code printed. Hidden tests never carry one. */
export type PracticeExampleRun = {
    readonly input: string
    readonly expected: string
    readonly actual: string
}

/** One test of a run, already in words. */
export type PracticeTestRow = {
    readonly id: string
    /** "Example 1" or "Hidden test 3". */
    readonly title: string
    /** `done` has a result, `running` is the test the judge works on, `waiting` was not reached. */
    readonly status: "done" | "running" | "waiting"
    readonly isPassed: boolean
    /** Time and memory ("25 ms · 3.5 MB"), or "not run yet" / "running" for a test without a result. */
    readonly meta: string
    /** Only an example test shows its data. */
    readonly example: PracticeExampleRun | undefined
}

/** The words of the result, resolved by its block. */
export type PracticeResultLabels = {
    readonly title: string
    readonly compileOutput: string
    readonly input: string
    readonly expected: string
    readonly actual: string
    readonly tests: string
    readonly testsEmpty: string
    readonly solutionTitle: string
    readonly solutionText: string
    readonly solutionAction: string
}

/** Where a run or submission stands. */
export type PracticeResultState =
    | { readonly kind: "idle" }
    | {
          readonly kind: "pending"
          readonly title: string
          readonly description: string
          readonly rows: ReadonlyArray<PracticeTestRow>
      }
    | {
          readonly kind: "settled"
          readonly tone: PracticeVerdictTone
          readonly title: string
          readonly description: string
          readonly compileOutput: string
          readonly rows: ReadonlyArray<PracticeTestRow>
          /** True for an accepted submission: the reference solution is offered under it. */
          readonly isAccepted: boolean
      }

/** The result of the last run or submission. */
type PracticeResultProps = {
    readonly state: PracticeResultState
    readonly labels: PracticeResultLabels
    /** Opens the reference solution; offered under an accepted submission. */
    readonly onSolution: () => void
}

/** The detail of an example test: what went in, what was expected and what came out. */
const ExampleDetail = (props: { readonly example: PracticeExampleRun; readonly labels: PracticeResultLabels }) => (
    <Stack gap="inline">
        <FencedCodeBlock label={props.labels.input} code={props.example.input} />
        <FencedCodeBlock label={props.labels.expected} code={props.example.expected} />
        <FencedCodeBlock label={props.labels.actual} code={props.example.actual} />
    </Stack>
)

/** One test as a row: pass or fail by direction and meta text, never by colour alone. */
const rowOf = (row: PracticeTestRow, labels: PracticeResultLabels): ListRowData => ({
    id: row.id,
    title: row.title,
    meta: { text: row.meta, ...(row.status === "done" && !row.isPassed ? { tone: "danger" as const } : {}) },
    ...(row.status === "done" ? { verdict: row.isPassed ? ("success" as const) : ("danger" as const) } : {}),
    ...(row.example === undefined || row.isPassed
        ? {}
        : { detail: <ExampleDetail example={row.example} labels={labels} /> }),
})

/** The per-test list of a run. */
const Tests = (props: { readonly rows: ReadonlyArray<PracticeTestRow>; readonly labels: PracticeResultLabels }) => (
    <Section
        kind="list"
        ariaLabel={props.labels.tests}
        empty={props.labels.testsEmpty}
        items={props.rows.map((row) => rowOf(row, props.labels))}
    />
)

/** The result of the last run or submission: the verdict line with its sentence, the compiler output, the test rows, and the reference solution after an accepted one. */
export const PracticeResult = (props: PracticeResultProps) => {
    const { state, labels } = props
    if (state.kind === "idle") return null
    const tone = state.kind === "pending" ? "informative" : state.tone
    return (
        <Section title={labels.title} headingLevel={2}>
            <Stack gap="row">
                <Alert tone={tone} title={state.title} description={state.description} />
                {state.kind === "settled" && state.compileOutput !== "" ? (
                    <FencedCodeBlock label={labels.compileOutput} code={state.compileOutput} />
                ) : null}
                {state.rows.length === 0 ? null : <Tests rows={state.rows} labels={labels} />}
                {state.kind === "settled" && state.isAccepted ? (
                    <Alert
                        tone="neutral"
                        title={labels.solutionTitle}
                        description={labels.solutionText}
                        action={{ label: labels.solutionAction, onAction: props.onSolution }}
                    />
                ) : null}
            </Stack>
        </Section>
    )
}
