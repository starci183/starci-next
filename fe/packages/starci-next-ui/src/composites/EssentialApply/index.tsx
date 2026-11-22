import {
    InlineStatus,
    ProportionBar,
    Section,
    Stack,
    Stepper,
    Terminal,
    Text,
    type ProportionBarPart,
    type StepperStepState,
} from "@starci/grammar/common"
import type { ReactNode } from "react"
import { RichMarkdown } from "../RichMarkdown"
import { LessonCode } from "../LessonCode"
import type { ApplyLabels, ApplyPartView, ChallengeDetailView } from "./types"

export type { ApplyLabels, ApplyPartView, ChallengeDetailView, LadderRungView, RubricRowView, RungState } from "./types"

/** The step state a step of the proof chain takes from the current one. */
const stepStateOf = (index: number, current: number): StepperStepState => {
    if (index < current) return "complete"
    return index === current ? "current" : "upcoming"
}

/** What the rubric needs. */
type RubricProps = { readonly challenge: ChallengeDetailView; readonly labels: ApplyLabels }

/** The tone of one part of the rubric bar: earned is green, missed is red, a critical one not yet scored is amber, the rest are plain. */
const partToneOf = (row: ChallengeDetailView["rubric"][number]) => {
    if (row.isEarned === true) return "success" as const
    if (row.isEarned === false) return "danger" as const
    return row.isCritical ? ("warning" as const) : ("neutral" as const)
}

/** The rubric of a rung as one bar split by points, the critical criteria first in the legend, each with its score once a run scored it. */
const Rubric = (props: RubricProps) => {
    const parts: ReadonlyArray<ProportionBarPart> = props.challenge.rubric.map((row) => ({
        id: row.id,
        label: row.isCritical ? `${row.criterion} · ${props.labels.critical}` : row.criterion,
        value: row.points,
        valueLabel: row.value,
        tone: partToneOf(row),
    }))
    return (
        <Section
            title={props.labels.rubric}
            headingLevel={2}
            fact={`${props.challenge.score}/${props.challenge.maxScore}`}
        >
            <ProportionBar
                label={props.labels.rubric}
                parts={parts}
                empty={<Text tone="muted">{props.labels.empty}</Text>}
            />
        </Section>
    )
}

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

/** The state of a rung at the end of its row: the score and how it stands. */
const RungStatus = (props: { readonly rung: ApplyPartView["rungs"][number] }) => {
    const { rung } = props
    const state = ({ passed: "done", doing: "waiting", open: "notRun", locked: "notRun" } as const)[rung.state]
    return (
        <InlineStatus
            state={state}
            label={rung.stateLabel}
            meta={rung.state === "locked" ? undefined : `${rung.score}/${rung.maxScore}`}
        />
    )
}

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
                isLoading={props.isLoading === true}
                empty={labels.empty}
                items={part.rungs.map((rung) => ({
                    id: rung.id,
                    title: `${rung.level} · ${rung.title}`,
                    value: <RungStatus rung={rung} />,
                    ...(rung.id === part.selectedId
                        ? { badges: [{ label: labels.current, tone: "accent" as const }] as const }
                        : {}),
                    ...(rung.state === "locked"
                        ? { state: "unavailable" as const }
                        : { onPress: () => props.onSelect(rung.id) }),
                }))}
            />
            {challenge === undefined ? null : <Detail challenge={challenge} labels={labels} essence={props.essence} />}
        </Stack>
    )
}
