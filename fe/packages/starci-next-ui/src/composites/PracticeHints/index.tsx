import { Section, type ListRowData } from "@starci/grammar/common"
import { RichMarkdown } from "../RichMarkdown"

/** One revealed hint of the ladder. */
export type PracticeHintItem = {
    readonly step: number
    readonly title: string
    readonly markdown: string
}

/** The words of the hint ladder, resolved by its block. */
export type PracticeHintsLabels = {
    readonly title: string
    /** "AI only hints, never writes your code". */
    readonly note: string
    readonly reveal: string
    readonly open: string
    readonly step: (step: number) => string
    readonly diagram: string
    readonly diagramError: string
}

/** The three-step hint ladder of a problem. */
type PracticeHintsProps = {
    readonly labels: PracticeHintsLabels
    readonly total: number
    readonly revealed: ReadonlyArray<PracticeHintItem>
    readonly isRevealing: boolean
    /** True while the problem has not arrived. */
    readonly isDisabled: boolean
    readonly onReveal: () => void
    readonly isLoading?: boolean
}

/** The hint ladder as one flat list: each step is a row, an opened one carries its text, the next one the command that opens it, the rest wait. */
export const PracticeHints = (props: PracticeHintsProps) => {
    const markdownLabels = { diagram: props.labels.diagram, diagramError: props.labels.diagramError }
    const rows: ReadonlyArray<ListRowData> = Array.from({ length: props.total }, (_, index): ListRowData => {
        const step = index + 1
        const opened = props.revealed.find((hint) => hint.step === step)
        if (opened !== undefined) {
            return {
                id: `hint-${step}`,
                title: props.labels.step(step),
                badges: [{ label: props.labels.open, tone: "success" }],
                detail: <RichMarkdown source={opened.markdown} labels={markdownLabels} />,
            }
        }
        const isNext = step === props.revealed.length + 1
        return {
            id: `hint-${step}`,
            title: props.labels.step(step),
            ...(isNext
                ? {
                      action: {
                          label: props.labels.reveal,
                          intent: "neutral" as const,
                          isPending: props.isRevealing,
                          isDisabled: props.isDisabled || props.isRevealing,
                          press: props.onReveal,
                      },
                      actionPlacement: "end" as const,
                  }
                : {}),
        }
    })
    return (
        <Section
            kind="list"
            title={props.labels.title}
            headingLevel={2}
            description={props.labels.note}
            isLoading={props.isLoading === true}
            items={rows}
            empty={props.labels.note}
        />
    )
}
