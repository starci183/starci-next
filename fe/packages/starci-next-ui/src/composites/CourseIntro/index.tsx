import { CheckIcon } from "@heroicons/react/24/outline"
import { DescriptionList, Section, Stack, Text } from "@starci/grammar/common"
import { MermaidDiagram } from "@starci/grammar/core/ext/graph"

/** One service of the lab as a row: its name and what it does. */
export type CourseIntroPartView = {
    readonly id: string
    readonly title: string
    readonly description: string
}

/**
 * The interview scene the page opens with: the moment, the setup, the question the learner would fail today (the interviewer's own words),
 * where the learner stumbles and what the lesson promises. Every line comes from the lesson's record.
 */
export type CourseIntroHookView = {
    readonly when: string
    readonly setup: string
    readonly question: string
    readonly stumble: string
    readonly promise: string
}

/** One thing the learner can do after the lesson, with the case that teaches it; the case line is empty when the line itself is the case's title. */
export type CourseIntroOutcomeView = {
    readonly id: string
    readonly can: string
    readonly caseTitle: string
}

/** What the intro page draws: the interview hook, what the learner will do, the architecture as Mermaid text, its services and what to know first. */
export type CourseIntroView = {
    /** The scene the lesson opens with; undefined for a lesson whose record has none. */
    readonly hook: CourseIntroHookView | undefined
    /** What the learner will be able to do, one line each, ticked. */
    readonly outcomes: ReadonlyArray<CourseIntroOutcomeView>
    /** The Mermaid flowchart of the lab, built from the lesson record; a node names its technology with `R@{ icon: "redis" }`. */
    readonly diagram: string
    readonly services: ReadonlyArray<CourseIntroPartView>
    /** The terms the learner should already know. */
    readonly requires: ReadonlyArray<string>
}

/** The words of the intro page. */
export type CourseIntroLabels = {
    readonly architectureTitle: string
    readonly diagramLabel: string
    readonly diagramError: string
    readonly diagramCaption: string
    readonly servicesTitle: string
    readonly outcomesTitle: string
    readonly requiresTitle: string
    readonly requiresNote: string
    readonly empty: string
}

/** What the intro page needs. */
type CourseIntroProps = {
    readonly view: CourseIntroView
    readonly labels: CourseIntroLabels
    readonly isLoading?: boolean
}

/** What a service does, under its name: it wraps on a phone, because its tail ("Database riêng: orders") is the fact the row is read for. */
const PartNote = (props: { readonly text: string }) => <Text tone="muted">{props.text}</Text>

/**
 * The interview scene: the moment in a muted line, the setup, the interviewer's question as the one big line of the page, then where the
 * learner stumbles and what the lesson promises.
 */
const Hook = (props: { readonly hook: CourseIntroHookView }) => (
    <Stack gap="section">
        <Text as="p" tone="muted">
            {props.hook.when}
        </Text>
        <Text as="p" role="reading.body">
            {props.hook.setup}
        </Text>
        <Text as="p" role="reading.title">
            {`“${props.hook.question}”`}
        </Text>
        <Text as="p" role="reading.body">
            {props.hook.stumble}
        </Text>
        <Text as="p" role="reading.body" tone="muted">
            {props.hook.promise}
        </Text>
    </Stack>
)

/**
 * The intro page of a lab: the interview question it will let the learner answer, what they will be able to do (ticked, one line per case),
 * the system on their machine drawn from the record with the Grammar's diagram, the services in words and what to know first.
 */
export const CourseIntro = (props: CourseIntroProps) => {
    const { view, labels } = props
    const isLoading = props.isLoading === true
    return (
        <Stack gap="region" measure="reading">
            {view.hook === undefined ? null : <Hook hook={view.hook} />}
            <Section
                kind="list"
                title={labels.outcomesTitle}
                headingLevel={2}
                isLoading={isLoading}
                empty={labels.empty}
                items={view.outcomes.map((line) => ({
                    id: line.id,
                    title: line.can,
                    leading: { icon: CheckIcon, size: "sm" as const },
                    ...(line.caseTitle === "" ? {} : { description: line.caseTitle }),
                }))}
            />
            <Section title={labels.architectureTitle} headingLevel={2} isLoading={isLoading}>
                <MermaidDiagram
                    source={view.diagram}
                    label={labels.diagramLabel}
                    errorTitle={labels.diagramError}
                    isLoading={isLoading}
                    caption={labels.diagramCaption}
                    height="md"
                />
            </Section>
            <Section
                kind="list"
                title={labels.servicesTitle}
                headingLevel={2}
                isLoading={isLoading}
                empty={labels.empty}
                items={view.services.map((part) => ({
                    id: part.id,
                    title: part.title,
                    detail: <PartNote text={part.description} />,
                }))}
            />
            {view.requires.length === 0 ? null : (
                <Section title={labels.requiresTitle} headingLevel={2} isLoading={isLoading}>
                    <DescriptionList
                        layout="stacked"
                        isDivided
                        items={[{ id: "requires", term: labels.requiresNote, description: view.requires.join(" · ") }]}
                    />
                </Section>
            )}
        </Stack>
    )
}
