import { Cluster, IconTile, Section, Stack, Text } from "@starci/grammar/common"

/** One thing the learner built: the question that asked for it, what they did, what the user gains and where that case stands. */
export type CoursePatternStepView = {
    readonly id: string
    /** The interviewer's question of the case, or the case's title when the record has no question. */
    readonly question: string
    /** What the learner did; empty when the record names none. */
    readonly did: string
    /** What the user gains; empty when the record names none. */
    readonly gain: string
    /** The English name of the idea, to search the docs with; empty when none (and in English, where it would repeat the line above). */
    readonly englishName: string
    /** True when the newest run of the case is green: the row's status mark is the green check, else the grey ring. */
    readonly isGreen: boolean
    /** The state in words, the accessible name of the status mark. */
    readonly stateLabel: string
}

/** What the recap page (page 6, the recap tab) draws in its main column. */
export type CoursePatternView = {
    /** The line that points back to the interview question of the first page (the record's recall title, else the app's own line). */
    readonly lead: string
    /** The interview question of the first page, without its quotes; empty when the record has no hook. */
    readonly question: string
    /** What the learner did, in plain words, one paragraph each, ending where the work gets its name; empty when the record has no recall. */
    readonly retell: ReadonlyArray<string>
    /**
     * The term of the lesson's concept. The recap is the first page allowed to name it (the REF rule: the pages before it show the situation
     * in plain words only); empty when the record names none.
     */
    readonly concept: string
    readonly steps: ReadonlyArray<CoursePatternStepView>
    /** The full answer to the interview question, the learner's to say now; empty when the record has none. */
    readonly answer: string
}

/** The words of the recap page. */
export type CoursePatternLabels = {
    /** The head of the concept block ("What you built has a name"). */
    readonly conceptTitle: string
    /** One line under the concept's term: why it is named only now. */
    readonly conceptNote: string
    readonly stepsTitle: string
    readonly stepsNote: string
    /** The line that explains the small English name under a row; shown only when some row carries one. */
    readonly englishNote: string
    readonly stepsEmpty: string
    /** The head of the full answer ("Now you can answer the interview question"). */
    readonly answerTitle: string
}

/** What the recap page needs. */
type CoursePatternProps = {
    readonly view: CoursePatternView
    readonly labels: CoursePatternLabels
    readonly isLoading?: boolean
}

/** What the recall needs: the page's view and whether its first read is still loading. */
type RecallProps = {
    readonly view: CoursePatternView
    readonly isLoading: boolean
}

/** What one row of the follow-up questions needs. */
type StepRowProps = {
    readonly step: CoursePatternStepView
    readonly isLoading: boolean
}

/**
 * The recall: the line that points back to the first page, then the interview question itself as the one big line, the way the intro set
 * it, so the learner reads the same words they could not answer then.
 */
const Recall = (props: RecallProps) => (
    <Stack gap="section">
        <Text as="p" tone="muted" isLoading={props.isLoading}>
            {props.view.lead}
        </Text>
        {props.view.question === "" ? null : (
            <Text as="p" role="reading.title">
                {`“${props.view.question}”`}
            </Text>
        )}
        {props.view.retell.map((paragraph) => (
            <Text key={paragraph} as="p" role="reading.body">
                {paragraph}
            </Text>
        ))}
    </Stack>
)

/**
 * One row of the follow-up questions list: a Grammar `IconTile` status mark leads it (lessons.md §7: a ticked list never draws a bare
 * glyph; green is the done plate with its check, a case not green on its newest run the grey ring), then the question as the row's title,
 * what the learner did, what the user gains in a muted line and the English name on its own caption line.
 */
const StepRow = (props: StepRowProps) => {
    const { step, isLoading } = props
    return (
        <Cluster gap="inline" align="start" wrap={false}>
            <IconTile state={step.isGreen ? "done" : "notRun"} ariaLabel={step.stateLabel} isLoading={isLoading} />
            <Stack gap="identity">
                <Text as="p" isStrong isLoading={isLoading}>
                    {step.question}
                </Text>
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
        </Cluster>
    )
}

/**
 * The main column of the recap page, as a mentor closes a lesson: the interview question recalled, the retelling, the concept named for the
 * first time, one row per question the interviewer pressed with what the learner did, and the full answer the learner can give now. The
 * progress card that leads to the submission stands in the page's rail, drawn by the app.
 */
export const CoursePattern = (props: CoursePatternProps) => {
    const { view, labels } = props
    const isLoading = props.isLoading === true
    const hasEnglish = view.steps.some((step) => step.englishName !== "")
    return (
        <Stack gap="region" measure="reading">
            <Recall view={view} isLoading={isLoading} />
            {view.concept === "" ? null : (
                <Section title={labels.conceptTitle} headingLevel={2} caption={labels.conceptNote}>
                    <Text as="p" role="reading.title">
                        {view.concept}
                    </Text>
                </Section>
            )}
            <Section
                title={labels.stepsTitle}
                caption={hasEnglish ? `${labels.stepsNote} ${labels.englishNote}` : labels.stepsNote}
                headingLevel={2}
                isLoading={isLoading}
            >
                {view.steps.length === 0 ? (
                    <Text as="p" tone="muted">
                        {labels.stepsEmpty}
                    </Text>
                ) : (
                    <Stack gap="inline">
                        {view.steps.map((step) => (
                            <StepRow key={step.id} step={step} isLoading={isLoading} />
                        ))}
                    </Stack>
                )}
            </Section>
            {view.answer === "" ? null : (
                <Section title={labels.answerTitle} headingLevel={2}>
                    <Text as="p" role="reading.body">
                        {`“${view.answer}”`}
                    </Text>
                </Section>
            )}
        </Stack>
    )
}
