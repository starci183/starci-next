import { Alert, Badge, Cluster, FencedCodeBlock, Stack, SurfaceCard, Text } from "@starci/grammar/common"

/** The tone of a verdict badge. */
export type PracticeVerdictTone = "success" | "danger" | "warning" | "neutral"

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
    readonly status: string
    readonly isPassed: boolean
    /** Time and memory ("25 ms · 3.5 MB"); empty when the judge did not report them. */
    readonly meta: string
    /** Only an example test shows its data. */
    readonly example: PracticeExampleRun | undefined
}

/** The words of the result card, resolved by its block. */
export type PracticeResultLabels = {
    readonly title: string
    readonly queued: string
    readonly running: string
    readonly compileOutput: string
    readonly input: string
    readonly expected: string
    readonly actual: string
    readonly tests: string
    readonly testsEmpty: string
    readonly passed: string
    readonly failed: string
}

/** Where a run or submission stands. */
export type PracticeResultState =
    | { readonly kind: "idle" }
    | { readonly kind: "pending"; readonly isQueued: boolean }
    | {
          readonly kind: "settled"
          readonly verdict: string
          readonly tone: PracticeVerdictTone
          /** "15/15 tests · 64 ms · 41 MB". */
          readonly summary: string
          readonly compileOutput: string
          readonly rows: ReadonlyArray<PracticeTestRow>
          /** The line under an accepted submission (what it counted for, the next problem); empty otherwise. */
          readonly followUp: string
      }

/** The result card of a run or a submission. */
type PracticeResultProps = {
    readonly state: PracticeResultState
    readonly labels: PracticeResultLabels
}

/** What the detail of an example test needs. */
type ExampleDetailProps = {
    readonly example: PracticeExampleRun
    readonly labels: PracticeResultLabels
}

/** The detail of an example test: what went in, what was expected and what came out. */
const ExampleDetail = (props: ExampleDetailProps) => (
    <Stack gap="inline">
        <FencedCodeBlock label={props.labels.input} code={props.example.input} />
        <FencedCodeBlock label={props.labels.expected} code={props.example.expected} />
        <FencedCodeBlock label={props.labels.actual} code={props.example.actual} />
    </Stack>
)

/** What the per-test list needs. */
type TestsProps = {
    readonly rows: ReadonlyArray<PracticeTestRow>
    readonly labels: PracticeResultLabels
}

/** The per-test summary of a settled run: pass or fail with time and memory; only example tests open their data. */
const Tests = (props: TestsProps) => (
    <SurfaceCard
        kind="list"
        label={props.labels.tests}
        empty={props.labels.testsEmpty}
        items={props.rows.map((row) => ({
            id: row.id,
            title: row.title,
            ...(row.meta === "" ? {} : { description: row.meta }),
            badges: [
                {
                    label: row.isPassed ? props.labels.passed : props.labels.failed,
                    tone: row.isPassed ? "success" : "danger",
                },
            ] as const,
            verdict: row.isPassed ? ("success" as const) : ("danger" as const),
            meta: { text: row.status },
            ...(row.example === undefined
                ? {}
                : { detail: <ExampleDetail example={row.example} labels={props.labels} /> }),
        }))}
    />
)

/** The result of the last run or submission: waiting, or the verdict with its summary, compile output and per-test rows. */
export const PracticeResult = (props: PracticeResultProps) => {
    const { state, labels } = props
    if (state.kind === "idle") return null
    if (state.kind === "pending") {
        return <Alert tone="informative" title={state.isQueued ? labels.queued : labels.running} />
    }
    return (
        <SurfaceCard label={labels.title}>
            <Stack gap="row">
                <Cluster gap="inline" wrap align="center">
                    <Badge tone={state.tone}>{state.verdict}</Badge>
                    <Text size="sm" tone="muted">
                        {state.summary}
                    </Text>
                </Cluster>
                {state.followUp === "" ? null : <Text as="p">{state.followUp}</Text>}
                {state.compileOutput === "" ? null : (
                    <FencedCodeBlock label={labels.compileOutput} code={state.compileOutput} />
                )}
                {state.rows.length === 0 ? null : <Tests rows={state.rows} labels={labels} />}
            </Stack>
        </SurfaceCard>
    )
}
