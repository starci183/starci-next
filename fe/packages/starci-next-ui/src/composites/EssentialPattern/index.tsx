import { DocumentTextIcon } from "@heroicons/react/24/outline"
import { Badge, Button, Cluster, DescriptionList, FencedCodeBlock, Section, Stack, Tabs, Text } from "@starci/grammar/common"
import type { PatternLabels, PatternPartView } from "../LessonFiveParts/types"

export type { PatternLabels, PatternPartView, PatternStackView } from "../LessonFiveParts/types"

/** One tab of the stack switch. */
type StackTab = { readonly id: string; readonly label: string }

/** The two to four tabs the given slots hold, in order. */
const tabsOf = (a: StackTab, b: StackTab, c: StackTab | undefined, d: StackTab | undefined) => {
    if (c === undefined) return [a, b] as const
    return d === undefined ? ([a, b, c] as const) : ([a, b, c, d] as const)
}

/** What the Pattern part needs. */
type EssentialPatternProps = {
    readonly part: PatternPartView
    readonly labels: PatternLabels
    readonly isLoading?: boolean
    readonly onSelect: (stack: string) => void
}

/** The stack switch: tabs over two to four stacks, a badge for a single one. */
const StackSwitch = (props: EssentialPatternProps) => {
    const items = props.part.stacks.map((stack) => ({ id: stack.id, label: stack.label }))
    const [a, b, c, d] = items
    if (a === undefined) return null
    if (b === undefined)
        return (
            <Cluster gap="identity">
                <Badge tone="neutral">{a.label}</Badge>
            </Cluster>
        )
    return (
        <Tabs
            appearance="primary"
            label={props.labels.stacks}
            items={tabsOf(a, b, c, d)}
            selectedKey={props.part.selected}
            onSelect={props.onSelect}
        />
    )
}

/** The three questions an AI does not answer by itself, as one list of a question and its short answer each. */
const Answers = (props: EssentialPatternProps) => (
    <Section title={props.labels.questions} headingLevel={2} isLoading={props.isLoading === true}>
        <DescriptionList
            isLoading={props.isLoading === true}
            items={props.part.answers.map((answer) => ({
                id: answer.id,
                term: answer.title,
                description: answer.text,
            }))}
        />
    </Section>
)

/**
 * Pattern: where a real project keeps the pattern, per stack. The three questions an AI does not answer by itself as three cards, the
 * business code that only declares the event, the main files of the platform folder as a short tree and the way to the repository.
 * A stack that is coming says so. Not graded.
 */
export const EssentialPattern = (props: EssentialPatternProps) => {
    const { part, labels } = props
    const isLoading = props.isLoading === true
    return (
        <Stack gap="region">
            <Text as="p">{labels.intro}</Text>
            <StackSwitch {...props} />
            {part.answers.length === 0 ? <Text tone="muted">{labels.soon}</Text> : <Answers {...props} />}
            {part.snippet === undefined ? null : (
                <Section title={labels.snippet} headingLevel={2} isLoading={isLoading}>
                    <FencedCodeBlock code={part.snippet.code} language={part.snippet.lang} label={part.snippet.file} />
                </Section>
            )}
            {part.files.length === 0 ? null : (
                <Section
                    kind="list"
                    title={labels.files(part.folder)}
                    headingLevel={2}
                    isLoading={isLoading}
                    empty={labels.filesEmpty}
                    items={part.files.map((file) => ({
                        id: file.id,
                        title: file.path,
                        description: file.note,
                        leading: { icon: DocumentTextIcon, size: "sm" as const },
                    }))}
                />
            )}
        </Stack>
    )
}

/** The primary of Pattern: the folder on GitHub; nothing for a stack without one. */
export const EssentialPatternLink = (props: { readonly href: string; readonly label: string }) =>
    props.href === "" ? null : (
        <Button variant="border" href={props.href}>
            {props.label}
        </Button>
    )
