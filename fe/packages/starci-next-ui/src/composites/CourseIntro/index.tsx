import { DescriptionList, Section, Stack, Text, type Figure } from "@starci/grammar/common"
import { MermaidDiagram, type MermaidTone } from "@starci/grammar/core/ext/graph"

/** One service or dependency of the lab as a row: its name with what identifies it, and what it does. */
export type CourseIntroPartView = {
    readonly id: string
    readonly title: string
    readonly description: string
}

/** What the intro page draws: the architecture as Mermaid text, its parts, what the learner will do and the cases count. */
export type CourseIntroView = {
    /** The Mermaid flowchart of the lab, built from the lesson record. */
    readonly diagram: string
    /** Which node of the diagram takes which tone. */
    readonly tones: Readonly<Record<string, MermaidTone>>
    /** One line of the diagram's legend: the tone and what it marks; empty when no node takes it. */
    readonly legend: ReadonlyArray<{ readonly tone: MermaidTone; readonly label: string }>
    readonly services: ReadonlyArray<CourseIntroPartView>
    readonly infra: ReadonlyArray<CourseIntroPartView>
    /** What the learner will be able to do, one sentence each. */
    readonly outcomes: ReadonlyArray<string>
    /** The terms the learner should already know. */
    readonly requires: ReadonlyArray<string>
    /** The cases counts, as figures. */
    readonly figures: ReadonlyArray<Figure>
    /** The one sentence under the figures that says what the lab is. */
    readonly summary: string
}

/** The words of the intro page. */
export type CourseIntroLabels = {
    readonly architectureTitle: string
    readonly diagramLabel: string
    readonly diagramError: string
    readonly diagramCaption: string
    readonly servicesTitle: string
    readonly infraTitle: string
    readonly outcomesTitle: string
    readonly requiresTitle: string
    readonly requiresNote: string
    readonly figuresLabel: string
    readonly empty: string
}

/** What the intro page needs. */
type CourseIntroProps = {
    readonly view: CourseIntroView
    readonly labels: CourseIntroLabels
    readonly isLoading?: boolean
}

/**
 * What a service or a dependency does, under its name: it wraps on a phone, because its tail ("Database riêng: orders") is the fact the
 * row is read for and a one-line description would cut it.
 */
const PartNote = (props: { readonly text: string }) => <Text tone="muted">{props.text}</Text>

/**
 * The intro page of a lab: the architecture drawn from the record with the Grammar's diagram, the services and the infrastructure
 * beside it in words, what the learner will be able to do and how many cases there are.
 */
export const CourseIntro = (props: CourseIntroProps) => {
    const { view, labels } = props
    const isLoading = props.isLoading === true
    return (
        <Stack gap="region">
            <Text as="p">{view.summary}</Text>
            <Section kind="figures" ariaLabel={labels.figuresLabel} items={view.figures} isLoading={isLoading} />
            <Section title={labels.architectureTitle} headingLevel={2} isLoading={isLoading}>
                <MermaidDiagram
                    source={view.diagram}
                    label={labels.diagramLabel}
                    errorTitle={labels.diagramError}
                    isLoading={isLoading}
                    tones={view.tones}
                    legend={view.legend}
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
                items={view.services.map((part) => ({ id: part.id, title: part.title, detail: <PartNote text={part.description} /> }))}
            />
            {view.infra.length === 0 ? null : (
                <Section
                    kind="list"
                    title={labels.infraTitle}
                    headingLevel={2}
                    isLoading={isLoading}
                    empty={labels.empty}
                    items={view.infra.map((part) => ({
                        id: part.id,
                        title: part.title,
                        detail: <PartNote text={part.description} />,
                    }))}
                />
            )}
            <Section
                kind="list"
                title={labels.outcomesTitle}
                headingLevel={2}
                isLoading={isLoading}
                empty={labels.empty}
                items={view.outcomes.map((line, index) => ({ id: `outcome-${index}`, title: line }))}
            />
            {view.requires.length === 0 ? null : (
                <Section title={labels.requiresTitle} headingLevel={2} isLoading={isLoading}>
                    <DescriptionList
                        layout="stacked"
                        isDivided
                        items={[{ id: "requires", term: labels.requiresNote, description: view.requires.join(", ") }]}
                    />
                </Section>
            )}
        </Stack>
    )
}
