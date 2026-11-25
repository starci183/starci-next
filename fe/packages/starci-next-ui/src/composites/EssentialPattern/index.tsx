import { DocumentTextIcon } from "@heroicons/react/24/outline"
import { HighlightedFence } from "../../branches/HighlightedCode/fence"
import { Badge, Button, Cluster, DescriptionList, Section, Select, Stack, Text } from "@starci/grammar/common"
import { RichMarkdown } from "../RichMarkdown"
import type { PatternLabels, PatternPartView } from "../LessonFiveParts/types"

export type { PatternLabels, PatternPartView, PatternStackView } from "../LessonFiveParts/types"

/** What the Pattern part needs. */
type EssentialPatternProps = {
    readonly part: PatternPartView
    readonly labels: PatternLabels
    readonly isLoading?: boolean
    readonly onSelect: (stack: string) => void
}

/**
 * The stack switch: choosing the stack is choosing a value, so it is a Grammar Select pill ("Stack: NestJS") that never overflows a phone,
 * not a segmented control; a single stack is a badge.
 */
const StackSwitch = (props: EssentialPatternProps) => {
    const [first, second] = props.part.stacks
    if (first === undefined) return null
    if (second === undefined)
        return (
            <Cluster gap="identity">
                <Badge tone="neutral">{first.label}</Badge>
            </Cluster>
        )
    return (
        <Cluster gap="identity">
            <Select
                label={props.labels.stacks}
                appearance="pill"
                prefix={`${props.labels.stacks}:`}
                options={props.part.stacks.map((stack) => ({ id: stack.id, label: stack.label }))}
                value={props.part.selected}
                onValueChange={(stack) => {
                    if (stack !== null) props.onSelect(stack)
                }}
            />
        </Cluster>
    )
}

/** The inline code marks of a one-line note: a list row's description is plain words, so `name` reads as name. */
const plainOf = (text: string): string => text.replaceAll("`", "")

/** The three questions an AI does not answer by itself: each question with its answer read as markdown (inline code drawn as code). */
const Answers = (props: EssentialPatternProps) => (
    <Section title={props.labels.questions} headingLevel={2} isLoading={props.isLoading === true}>
        <DescriptionList
            layout="stacked"
            isDivided
            isLoading={props.isLoading === true}
            items={props.part.answers.map((answer) => ({
                id: answer.id,
                term: answer.title,
                description: <RichMarkdown source={answer.text} measure="compact" />,
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
                    <HighlightedFence code={part.snippet.code} language={part.snippet.lang} label={part.snippet.file} />
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
                        description: plainOf(file.note),
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
