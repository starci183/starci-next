import { Badge, Cluster, FencedCodeBlock, Heading, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { MarkdownBody, type MarkdownBlock } from "../MarkdownBody"

/** One example of a problem. */
export type PracticeExample = { readonly input: string; readonly output: string }

/** The words of the problem panel, resolved by its block. */
export type PracticeProblemLabels = {
    readonly examples: string
    readonly input: string
    readonly output: string
    readonly diagram: string
    readonly diagramError: string
}

/** The statement of one problem, already in words. */
type PracticeProblemPanelProps = {
    /** The line above the title: the pattern and the place of the problem in it. */
    readonly eyebrow: string
    readonly title: string
    readonly difficulty: string
    readonly difficultyTone: "success" | "warning" | "danger" | "neutral"
    /** The tags, then the limits ("2 s · 256 MB"), as quiet badges. */
    readonly facts: ReadonlyArray<string>
    readonly blocks: ReadonlyArray<MarkdownBlock>
    readonly examples: ReadonlyArray<PracticeExample>
    readonly labels: PracticeProblemLabels
    readonly isLoading?: boolean
}

/** The problem panel: pattern line, title, difficulty and limits, the statement from the data's markdown, then the examples. */
export const PracticeProblemPanel = (props: PracticeProblemPanelProps) => (
    <SurfaceCard ariaLabel={props.title} {...(props.isLoading === true ? { isLoading: true } : {})}>
        <Stack gap="row">
            <Text size="sm" tone="muted">
                {props.eyebrow}
            </Text>
            <Cluster gap="inline" wrap align="center">
                <Badge tone={props.difficultyTone}>{props.difficulty}</Badge>
                {props.facts.map((fact) => (
                    <Badge key={fact} tone="muted">
                        {fact}
                    </Badge>
                ))}
            </Cluster>
            <MarkdownBody
                blocks={props.blocks}
                diagramLabel={props.labels.diagram}
                diagramErrorTitle={props.labels.diagramError}
                {...(props.isLoading === true ? { isLoading: true } : {})}
            />
            {props.examples.length === 0 ? null : (
                <Stack gap="row">
                    <Heading level={3} scale="standard">
                        {props.labels.examples}
                    </Heading>
                    {props.examples.map((example, index) => (
                        <Stack key={`${example.input}-${example.output}`} gap="inline">
                            <FencedCodeBlock label={`${props.labels.input} ${index + 1}`} code={example.input} />
                            <FencedCodeBlock label={`${props.labels.output} ${index + 1}`} code={example.output} />
                        </Stack>
                    ))}
                </Stack>
            )}
        </Stack>
    </SurfaceCard>
)
