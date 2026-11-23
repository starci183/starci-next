import { Cluster, InlineStatus, Progress, Section, Stack, Stepper, Text } from "@starci/grammar/common"

/** One part of the lesson on the rail: its name, where the learner stands in it and whether the plan lacks it. */
export type LessonRailStep = {
    readonly id: string
    readonly title: string
    /** The line under the name ("2/5 câu", "6 phút"). */
    readonly note: string
    readonly state: "complete" | "current" | "upcoming"
    /** True when the reader's plan lacks the part: its line carries the lock. The step still opens (the notice there says what Premium adds). */
    readonly isLocked: boolean
}

/** The head of the rail: the lesson, its one-line promise and how far the learner is. */
export type LessonRailHead = {
    readonly title: string
    readonly promise: string
    /** The name of the progress bar ("Tiến độ") and its figure ("1/5 phần · 40 phút"). */
    readonly progressLabel: string
    readonly progressText: string
    /** The parts done, 0 to 100. */
    readonly progress: number
}

/** The questions of the part on screen, opened under the steps: each its time and short title, the one on screen marked. */
export type LessonRailQuestions = {
    readonly label: string
    /** The word of a solved question ("Đúng"). */
    readonly doneLabel: string
    readonly items: ReadonlyArray<{
        readonly id: string
        readonly at: string
        readonly title: string
        readonly isCurrent: boolean
        readonly isDone: boolean
    }>
    readonly onSelect: (id: string) => void
}

/** What the rail needs. */
type LessonRailProps = {
    readonly label: string
    readonly head: LessonRailHead
    readonly steps: ReadonlyArray<LessonRailStep>
    /** The part on screen; empty when none is (the end-of-lesson screen). */
    readonly currentId: string
    readonly onSelect: (id: string) => void
    /** The questions of the part on screen (Mở đầu); undefined for a part without them. */
    readonly questions?: LessonRailQuestions
    readonly isLoading?: boolean
}

/** The line under a part's name: its note in words only (a 12px line carries no leading icon, the icon table of Grammar 0.57.0); the note says a part is locked. */
const noteOf = (step: LessonRailStep) => step.note

/**
 * The lesson's rail, always on screen: the title, its one-line promise and the progress bar ("1/5 phần · 40 phút"), then the five
 * parts as numbered steps (the current one highlighted, a done one checked, a locked one with the lock on its line), each opening its
 * part.
 */
export const LessonRail = (props: LessonRailProps) => {
    const isLoading = props.isLoading === true
    return (
        <Stack gap="region">
            <Stack gap="section">
                <Stack gap="identity">
                    <Text role="title.section" isLoading={isLoading}>
                        {props.head.title}
                    </Text>
                    {props.head.promise === "" ? null : (
                        <Text tone="muted" isLoading={isLoading}>
                            {props.head.promise}
                        </Text>
                    )}
                </Stack>
                <Stack gap="identity">
                    <Cluster gap="inline" justify="between">
                        <Text role="caption" tone="muted" isLoading={isLoading}>
                            {props.head.progressLabel}
                        </Text>
                        <Text role="caption" tone="muted" tabular isLoading={isLoading}>
                            {props.head.progressText}
                        </Text>
                    </Cluster>
                    <Progress
                        label={props.head.progressLabel}
                        value={props.head.progress}
                        valueText={props.head.progressText}
                        isLoading={isLoading}
                    />
                </Stack>
            </Stack>
            <Stepper
                label={props.label}
                orientation="vertical"
                currentStepId={props.currentId}
                onStepSelect={props.onSelect}
                isLoading={isLoading}
                steps={props.steps.map((step) => ({
                    id: step.id,
                    label: isLoading ? "" : step.title,
                    description: noteOf(step),
                    state: step.state,
                }))}
            />
            {props.questions === undefined ? null : <QuestionList questions={props.questions} isLoading={isLoading} />}
        </Stack>
    )
}

/** The questions of the part on screen: a row each (its short title, its time under it), the one on screen on the accent edge, a solved one marked. */
const QuestionList = (props: { readonly questions: LessonRailQuestions; readonly isLoading: boolean }) => (
    <Section
        kind="list"
        title={props.questions.label}
        headingLevel={3}
        isLoading={props.isLoading}
        empty={null}
        items={props.questions.items.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.at,
            onPress: () => props.questions.onSelect(item.id),
            ...(item.isCurrent ? { edgeTone: "accent" as const } : {}),
            ...(item.isDone ? { value: <InlineStatus state="done" label={props.questions.doneLabel} /> } : {}),
        }))}
    />
)

/** What the phone bar needs. */
type LessonRailBarProps = {
    readonly label: string
    readonly steps: ReadonlyArray<LessonRailStep>
    readonly currentId: string
    /** "Phần 1/5 · Mở đầu · 2/5": the line under the bar. */
    readonly summary: string
    readonly isLoading?: boolean
}

/** The phone form of the rail: one segment per part, filled up to the current part, with where the reader is under it. */
export const LessonRailBar = (props: LessonRailBarProps) => (
    <Stepper
        kind="bar"
        label={props.label}
        currentStepId={props.currentId}
        isLoading={props.isLoading === true}
        steps={props.steps.map((step) => ({
            id: step.id,
            label: step.id === props.currentId ? props.summary : step.title,
            state: step.state,
        }))}
    />
)
