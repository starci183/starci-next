import { DataTable, InlineStatus, Section, Stack, Text, type DataTableColumn } from "@starci/grammar/common"
import { MermaidDiagram, type MermaidTone } from "@starci/grammar/core/ext/graph"

/** One thing the learner built, with the case that asked for it and where that case stands. */
export type CoursePatternStepView = {
    readonly id: string
    /** The case, in the learner's language. */
    readonly title: string
    /** The term the case teaches, or empty when the record names none. */
    readonly teaches: string
    readonly isGreen: boolean
    readonly stateLabel: string
}

/** One line of the map from the learner's file to the framework version. */
export type CoursePatternMapRow = {
    readonly id: string
    readonly from: string
    readonly to: string
}

/** What the naming page draws. */
export type CoursePatternView = {
    /** The term of the lesson's concept, taken from the record's allowed terms. */
    readonly term: string
    /** The architecture again, with the concept on its node. */
    readonly diagram: string
    readonly tones: Readonly<Record<string, MermaidTone>>
    readonly steps: ReadonlyArray<CoursePatternStepView>
    readonly map: ReadonlyArray<CoursePatternMapRow>
}

/** The words of the naming page. */
export type CoursePatternLabels = {
    readonly lead: string
    readonly diagramTitle: string
    readonly diagramLabel: string
    readonly diagramError: string
    readonly stepsTitle: string
    readonly stepsNote: string
    readonly stepsEmpty: string
    readonly mapTitle: string
    readonly mapNote: string
    readonly mapFrom: string
    readonly mapTo: string
    readonly mapEmpty: string
}

/** What the naming page needs. */
type CoursePatternProps = {
    readonly view: CoursePatternView
    readonly labels: CoursePatternLabels
    readonly isLoading?: boolean
}

/** The map from the learner's file to the framework version, as a flat table. */
const MapTable = (props: Pick<CoursePatternProps, "view" | "labels">) => {
    const { view, labels } = props
    return (
        <DataTable
            label={labels.mapTitle}
            rows={view.map}
            columns={
                [
                    { id: "from", label: labels.mapFrom, isRowHeader: true, width: "fill", minWidth: 220 },
                    { id: "to", label: labels.mapTo, width: "fill", minWidth: 220 },
                ] satisfies DataTableColumn[]
            }
            renderCell={(row: CoursePatternMapRow, column) => (column === "from" ? row.from : row.to)}
            emptyContent={labels.mapEmpty}
        />
    )
}

/**
 * The page that names the pattern: the concept's term, only now; the architecture again with the concept on its node; what the learner
 * built step by step against the cases that asked for it; and the map from their file to the framework version.
 */
export const CoursePattern = (props: CoursePatternProps) => {
    const { view, labels } = props
    const isLoading = props.isLoading === true
    return (
        <Stack gap="region">
            <Stack gap="identity">
                <Text as="p" tone="muted">
                    {labels.lead}
                </Text>
                <Text as="p" role="title.page">
                    {view.term}
                </Text>
            </Stack>
            <Section title={labels.diagramTitle} headingLevel={2} isLoading={isLoading}>
                <MermaidDiagram
                    source={view.diagram}
                    label={labels.diagramLabel}
                    errorTitle={labels.diagramError}
                    isLoading={isLoading}
                    tones={view.tones}
                    height="md"
                />
            </Section>
            <Section
                kind="list"
                title={labels.stepsTitle}
                caption={labels.stepsNote}
                headingLevel={2}
                isLoading={isLoading}
                empty={labels.stepsEmpty}
                items={view.steps.map((step) => ({
                    id: step.id,
                    title: step.title,
                    ...(step.teaches === "" ? {} : { description: step.teaches }),
                    value: <InlineStatus state={step.isGreen ? "done" : "notRun"} label={step.stateLabel} />,
                }))}
            />
            <Section title={labels.mapTitle} caption={labels.mapNote} headingLevel={2} isLoading={isLoading}>
                <MapTable view={view} labels={labels} />
            </Section>
        </Stack>
    )
}
