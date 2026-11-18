import { Alert, Section, Stack, Stepper, Terminal, type StepperStepState } from "@starci/grammar/common"
import type { ReactNode } from "react"
import { RichMarkdown } from "../RichMarkdown"
import { LessonCode } from "../LessonCode"
import type { ApplyLabels, ApplyPartView, ChallengeDetailView, RungState } from "./types"

export { EssentialApplyAside } from "./Aside"
export type {
    ApplyAsideLabels,
    ApplyLabels,
    ApplyPartView,
    ChallengeDetailView,
    LadderRungView,
    RubricRowView,
    RungState,
} from "./types"

/** The badge tone of a rung state. */
const rungTone = (state: RungState) => {
    if (state === "passed") return "success" as const
    if (state === "doing") return "warning" as const
    return "muted" as const
}

/** The step state a step of the proof chain takes from the current one. */
const stepStateOf = (index: number, current: number): StepperStepState => {
    if (index < current) return "complete"
    return index === current ? "current" : "upcoming"
}

/** What the rubric needs. */
type RubricProps = { readonly challenge: ChallengeDetailView; readonly labels: ApplyLabels }

/** The rubric of a rung: a row per criterion with its points, the critical badge and a verdict once a run scored it. */
const Rubric = (props: RubricProps) => (
    <Section
        kind="list"
        title={props.labels.rubric}
        headingLevel={2}
        empty={props.labels.empty}
        items={props.challenge.rubric.map((row) => ({
            id: row.id,
            title: row.criterion,
            value: row.value,
            ...(row.isCritical
                ? { badges: [{ label: props.labels.critical, tone: "warning" as const }] as const }
                : {}),
            ...(row.isEarned === undefined
                ? {}
                : { verdict: row.isEarned ? ("success" as const) : ("danger" as const) }),
        }))}
    />
)

/** What the detail of an open rung needs. */
type DetailProps = {
    readonly challenge: ChallengeDetailView
    readonly labels: ApplyLabels
    readonly essence: ReactNode
}

/** The detail of a rung that is open: the brief, the terminal, the rubric, the essence check and the chain to the proof. */
const Detail = (props: DetailProps) => {
    const { challenge, labels } = props
    return (
        <Stack gap="region">
            <Section title={challenge.heading} headingLevel={2} fact={challenge.stateLabel}>
                <Stack gap="inline">
                    <RichMarkdown
                        source={challenge.brief}
                        labels={labels.markdown}
                        renderCode={(code) => <LessonCode code={code} />}
                    />
                    <Terminal label={challenge.heading} lines={challenge.terminal} />
                </Stack>
            </Section>
            <Rubric challenge={challenge} labels={labels} />
            {props.essence === null ? null : (
                <Section title={labels.essence} headingLevel={2}>
                    {props.essence}
                </Section>
            )}
            <Section title={labels.proof} headingLevel={2} caption={labels.proofNote}>
                <Stepper
                    label={labels.proof}
                    currentStepId={`step-${challenge.proofStep}`}
                    steps={labels.proofSteps.map((label, index) => ({
                        id: `step-${index}`,
                        label,
                        state: stepStateOf(index, challenge.proofStep),
                    }))}
                />
            </Section>
        </Stack>
    )
}

/** The body under the ladder: the way to open a locked rung, or the detail of an open one. */
const RungBody = (props: DetailProps) =>
    props.challenge.isLocked ? (
        <Alert tone="informative" title={props.challenge.lockTitle} description={props.challenge.lockText} />
    ) : (
        <Detail challenge={props.challenge} labels={props.labels} essence={props.essence} />
    )

/** What the apply part needs: the view, the words, the essence check already drawn and what the learner does. */
type EssentialApplyProps = {
    readonly part: ApplyPartView
    readonly labels: ApplyLabels
    /** The essence check of the rung (choices graded on the spot), already drawn; null when the rung has none. */
    readonly essence: ReactNode
    readonly isLoading?: boolean
    readonly onSelect: (challengeId: string) => void
}

/**
 * The apply part: the four rungs as a flat list (the one on screen tinted, a rung that is not open says how it opens), then the
 * rung on screen: its brief, the terminal of the hidden run, the rubric with the points each criterion earned, the essence check
 * and the chain from practice on the machine to proof (only CI with OIDC proves).
 */
export const EssentialApply = (props: EssentialApplyProps) => {
    const { part, labels } = props
    const challenge = part.challenge
    return (
        <Stack gap="region">
            <Section
                kind="list"
                title={labels.ladder}
                headingLevel={2}
                empty={labels.empty}
                isLoading={props.isLoading === true}
                items={part.rungs.map((rung) => ({
                    id: rung.id,
                    title: rung.level,
                    description: rung.title,
                    badges: [{ label: rung.stateLabel, tone: rungTone(rung.state) }] as const,
                    onPress: () => props.onSelect(rung.id),
                    ...(rung.id === part.selectedId ? { state: "informative" as const } : {}),
                }))}
            />
            {challenge === undefined ? null : (
                <RungBody challenge={challenge} labels={labels} essence={props.essence} />
            )}
        </Stack>
    )
}
