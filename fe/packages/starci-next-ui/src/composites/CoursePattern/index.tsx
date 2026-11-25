import { InlineStatus, Section, Stack, Text } from "@starci/grammar/common"

/** One thing the learner built: the question that asked for it, what they did, what the customer gains and where that case stands. */
export type CoursePatternStepView = {
    readonly id: string
    /** The interviewer's question of the case, or the case's title when the record has no question. */
    readonly question: string
    /** What the learner did; empty until the case was green once or when the record names none. */
    readonly did: string
    /** What the customer gains; empty until the case was green once or when the record names none. */
    readonly gain: string
    /** The English name of the idea, to search the docs with; empty when none (and in English, where it would repeat the line above). */
    readonly englishName: string
    readonly isGreen: boolean
    readonly stateLabel: string
}

/** What the naming page draws. */
export type CoursePatternView = {
    /** The line that points back to the interview question of the first page. */
    readonly lead: string
    /** What the learner did, in plain words, one paragraph each, ending where the work gets its name; empty until every case was green. */
    readonly retell: ReadonlyArray<string>
    readonly steps: ReadonlyArray<CoursePatternStepView>
}

/** The words of the naming page. */
export type CoursePatternLabels = {
    readonly stepsTitle: string
    readonly stepsNote: string
    readonly stepsEmpty: string
}

/** What the naming page needs. */
type CoursePatternProps = {
    readonly view: CoursePatternView
    readonly labels: CoursePatternLabels
    readonly isLoading?: boolean
}

/**
 * What a row of the naming page says under its question: what the learner did, what the customer gains and, on its own muted line in
 * English, the name of the idea to search the docs with.
 */
const StepDetail = (props: { readonly step: CoursePatternStepView }) => {
    const { step } = props
    return (
        <Stack gap="identity">
            {step.did === "" ? null : <Text as="p">{step.did}</Text>}
            {step.gain === "" ? null : (
                <Text as="p" tone="muted">
                    {step.gain}
                </Text>
            )}
            {step.englishName === "" ? null : (
                <span lang="en">
                    <Text as="p" role="caption" tone="muted">
                        {step.englishName}
                    </Text>
                </span>
            )}
        </Stack>
    )
}

/**
 * The page that names what the learner built, as a mentor would: it points back to the interview question, retells in plain words what
 * the learner did (the retelling ends on the work's name) and closes with one row per case (the question it asked,
 * what they did, what the customer gains, the English name on its own muted line).
 */
export const CoursePattern = (props: CoursePatternProps) => {
    const { view, labels } = props
    const isLoading = props.isLoading === true
    return (
        <Stack gap="region" measure="reading">
            <Stack gap="section">
                <Text as="p" tone="muted">
                    {view.lead}
                </Text>
                {view.retell.map((paragraph) => (
                    <Text key={paragraph} as="p" role="reading.body">
                        {paragraph}
                    </Text>
                ))}
            </Stack>
            <Section
                kind="list"
                title={labels.stepsTitle}
                caption={labels.stepsNote}
                headingLevel={2}
                isLoading={isLoading}
                empty={labels.stepsEmpty}
                items={view.steps.map((step) => ({
                    id: step.id,
                    title: step.question,
                    detail: <StepDetail step={step} />,
                    value: <InlineStatus state={step.isGreen ? "done" : "notRun"} label={step.stateLabel} />,
                }))}
            />
        </Stack>
    )
}
