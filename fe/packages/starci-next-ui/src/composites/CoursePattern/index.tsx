import { Badge, Cluster, IconTile, Section, Stack, Text } from "@starci/grammar/common"
import { ITEM_TILE } from "../../leaves/Icon"
import { InterviewerQuote, NarrationText, Narrator, narrationTermsOf, type NarrationTerm, type NarratorView } from "../Narration"

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
    /** Who asked it, as the source of the question's Quote: the mentor himself ("Thầy StarCi · CTO nivo.vn"). */
    readonly asker: string
    /** What the learner did, in plain words, one paragraph each, ending where the work gets its name; empty when the record has no recall. */
    readonly retell: ReadonlyArray<string>
    /**
     * The term of the lesson's concept. The recap is the first page allowed to name it (the REF rule: the pages before it show the situation
     * in plain words only); empty when the record names none.
     */
    readonly concept: string
    /** The concept's one-line definition (its term's note, the intro's brief); empty draws none. */
    readonly conceptBrief: string
    readonly steps: ReadonlyArray<CoursePatternStepView>
    /** The full answer to the interview question, the learner's to say now; empty when the record has none. */
    readonly answer: string
    /** The narration's keywords and their notes, the concept's own words included on this naming page (lessons.md §9). */
    readonly terms: ReadonlyArray<NarrationTerm>
    /** The mentor who narrates the retelling: his photo and label. */
    readonly narrator: NarratorView
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
    /** The two names of a recap line: what the learner did, what users gain. */
    readonly didLabel: string
    readonly gainLabel: string
    /** The line of a question not passed yet: its recap opens once it passes. */
    readonly lockedNote: string
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
    readonly terms: ReadonlyArray<NarrationTerm>
    readonly isLoading: boolean
}

/**
 * The recall: the line that points back to the first page, then the interview question itself as the one big line with who asked it, the
 * way the intro set it, so the learner reads the same words they could not answer then; then the mentor (photo and label) retells what
 * the learner did. The retelling is one section: a keyword is marked where it first stands in it.
 */
const Recall = (props: RecallProps) => {
    const { view } = props
    const marks = narrationTermsOf(view.retell, view.terms)
    return (
        <Stack gap="section">
            <Text as="p" tone="muted" isLoading={props.isLoading}>
                {view.lead}
            </Text>
            {view.question === "" && view.retell.length === 0 ? null : (
                // One person recalls and asked (owner 2026-11-28: "là thầy hỏi đó"): his header once, his question, then his retelling.
                <Narrator narrator={view.narrator}>
                    {view.question === "" ? null : <InterviewerQuote quote={view.question} />}
                    {view.retell.map((paragraph, index) => (
                        <Text key={paragraph} as="p" role="reading.body">
                            <NarrationText text={paragraph} terms={marks[index] ?? []} />
                        </Text>
                    ))}
                </Narrator>
            )}
        </Stack>
    )
}

/**
 * One line of the follow-up questions (owner 2026-11-28): the round 24 leads it (the tick once passed, the empty circle before), then the
 * question, then, once the question passed (the server sends the recap only then), what the learner did and what users gain, each after its
 * muted name, and the English name as an accent badge; a question not passed yet says so in one muted line.
 */
const StepRow = (props: StepRowProps & { readonly labels: CoursePatternLabels }) => {
    const { step, isLoading, labels } = props
    // The question is the interviewer's (plain); what the learner did and gains is narration, one section per row.
    const [did, gain] = narrationTermsOf([step.did, step.gain], props.terms)
    const hasRecap = step.did !== "" || step.gain !== ""
    return (
        <Cluster gap="inline" align="start" wrap={false}>
            {/* A line of the list's content: the round 24 (owner 2026-11-28), the tick once passed, the empty circle before. */}
            <IconTile state={step.isGreen ? "done" : "notRun"} ariaLabel={step.stateLabel} isLoading={isLoading} {...ITEM_TILE} />
            <Stack gap="identity">
                <Text as="p" isStrong isLoading={isLoading}>
                    {step.question}
                </Text>
                {hasRecap ? null : (
                    <Text as="p" role="caption" tone="muted">
                        {labels.lockedNote}
                    </Text>
                )}
                {step.did === "" ? null : (
                    <Text as="p">
                        <Text as="span" tone="muted">{`${labels.didLabel}: `}</Text>
                        <NarrationText text={step.did} terms={did ?? []} />
                    </Text>
                )}
                {step.gain === "" ? null : (
                    <Text as="p">
                        <Text as="span" tone="muted">{`${labels.gainLabel}: `}</Text>
                        <NarrationText text={step.gain} terms={gain ?? []} />
                    </Text>
                )}
                {step.englishName === "" ? null : (
                    <span lang="en">
                        <Badge tone="accent">{step.englishName}</Badge>
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
        // The main column of a split page (owner 2026-11-28: "responsive ở giữa, bên phải dính bên phải"): the reading measure keeps the text
        // readable and centres it in the grid's fluid track, while the rail stays pinned to the right edge.
        <Stack gap="region" measure="reading">
            <Recall view={view} isLoading={isLoading} />
            {view.concept === "" ? null : (
                <Section title={labels.conceptTitle} headingLevel={2} caption={labels.conceptNote}>
                    <Stack gap="identity">
                        <Text as="p" role="reading.title">
                            {view.concept}
                        </Text>
                        {view.conceptBrief === "" ? null : <Text as="p">{view.conceptBrief}</Text>}
                    </Stack>
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
                    <Stack gap="row">
                        {view.steps.map((step) => (
                            <StepRow key={step.id} step={step} terms={view.terms} isLoading={isLoading} labels={labels} />
                        ))}
                    </Stack>
                )}
            </Section>
            {view.answer === "" ? null : (
                // The full answer the learner can give now, as a quote of its own (owner 2026-11-28: the recap closes on it).
                <Section title={labels.answerTitle} headingLevel={2}>
                    <InterviewerQuote quote={view.answer} />
                </Section>
            )}
        </Stack>
    )
}
