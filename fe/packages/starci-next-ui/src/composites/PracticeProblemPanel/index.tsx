import { FencedCodeBlock, Section, Stack } from "@starci/grammar/common"
import { RichMarkdown } from "../RichMarkdown"

/** One example of a problem. */
export type PracticeExample = { readonly input: string; readonly output: string }

/** The words of the problem panel, resolved by its block. */
export type PracticeProblemLabels = {
    readonly title: string
    readonly examples: string
    readonly input: string
    readonly output: string
    readonly diagram: string
    readonly diagramError: string
}

/** The statement of one problem, already in words. */
type PracticeProblemPanelProps = {
    readonly markdown: string
    readonly examples: ReadonlyArray<PracticeExample>
    readonly labels: PracticeProblemLabels
    readonly isLoading?: boolean
}

/** The problem panel: the statement from the markdown of the data, then the examples as input and output blocks. It stands on the page, never in a card. */
export const PracticeProblemPanel = (props: PracticeProblemPanelProps) => (
    <Stack gap="section">
        <Section ariaLabel={props.labels.title} {...(props.isLoading === true ? { isLoading: true } : {})}>
            <RichMarkdown
                source={props.markdown}
                isLoading={props.isLoading === true}
                labels={{ diagram: props.labels.diagram, diagramError: props.labels.diagramError }}
            />
        </Section>
        {props.examples.length === 0 ? null : (
            <Section title={props.labels.examples} headingLevel={3}>
                <Stack gap="inline">
                    {props.examples.map((example) => (
                        <Stack key={`${example.input}-${example.output}`} gap="identity">
                            <FencedCodeBlock label={props.labels.input} code={example.input} />
                            <FencedCodeBlock label={props.labels.output} code={example.output} />
                        </Stack>
                    ))}
                </Stack>
            </Section>
        )}
    </Stack>
)
