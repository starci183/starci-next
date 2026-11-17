import { Code, FencedCodeBlock, Link, MarkdownArticle, MermaidDiagram, Stack, Text } from "@starci/grammar/common"

/** One run of inline text inside a paragraph, a list item or a quote. */
export type InlineNode = {
    /** A stable key inside its block. */
    readonly id: string
    /** Plain text, strong text, an inline code span or a link. */
    readonly kind: "text" | "strong" | "code" | "link"
    /** The words of the run. */
    readonly text: string
    /** The destination of a link; empty for every other kind. */
    readonly href: string
}

/** One block of a lesson body, read from its markdown. */
export type MarkdownBlock =
    | { readonly id: string; readonly kind: "heading"; readonly level: 2 | 3 | 4; readonly text: string }
    | { readonly id: string; readonly kind: "paragraph"; readonly runs: ReadonlyArray<InlineNode> }
    | { readonly id: string; readonly kind: "quote"; readonly runs: ReadonlyArray<InlineNode> }
    | {
          readonly id: string
          readonly kind: "list"
          readonly isOrdered: boolean
          readonly items: ReadonlyArray<{ readonly id: string; readonly runs: ReadonlyArray<InlineNode> }>
      }
    | { readonly id: string; readonly kind: "code"; readonly language: string; readonly code: string }
    | { readonly id: string; readonly kind: "mermaid"; readonly source: string }

/** The words a diagram carries; resolved by the block. */
type MarkdownBodyProps = {
    /** The blocks of the body, in reading order. */
    readonly blocks: ReadonlyArray<MarkdownBlock>
    /** The accessible name of every diagram of the body. */
    readonly diagramLabel: string
    /** The title shown when a diagram cannot be drawn. */
    readonly diagramErrorTitle: string
    readonly isLoading?: boolean
}

/** One run of text, drawn by its kind. */
type RunProps = { readonly node: InlineNode }

/** True for a destination off this site, which opens in its own context. */
const isExternal = (href: string): boolean => href.startsWith("http://") || href.startsWith("https://")

/** One inline run: plain words, strong words, a code span or a link. */
const Run = (props: RunProps) => {
    if (props.node.kind === "strong") {
        return (
            <Text as="span" isStrong>
                {props.node.text}
            </Text>
        )
    }
    if (props.node.kind === "code") return <Code>{props.node.text}</Code>
    if (props.node.kind === "link")
        return (
            <Link href={props.node.href} {...(isExternal(props.node.href) ? { kind: "external" as const } : {})}>
                {props.node.text}
            </Link>
        )
    return <Text as="span">{props.node.text}</Text>
}

/** The runs of a paragraph, a list item or a quote. */
type RunsProps = { readonly runs: ReadonlyArray<InlineNode> }

/** The inline runs of one line of text. */
const Runs = (props: RunsProps) => props.runs.map((node) => <Run key={node.id} node={node} />)

/** The marker of a list item: its number in an ordered list, a bullet in the other kind. */
const markerOf = (isOrdered: boolean, index: number): string => (isOrdered ? `${index + 1}.` : "•")

/** What a block needs besides itself. */
type BlockProps = {
    readonly block: MarkdownBlock
    readonly diagramLabel: string
    readonly diagramErrorTitle: string
    readonly isLoading: boolean
}

/** What a heading needs: its outline level and its words. */
type HeadingOfProps = { readonly level: 2 | 3 | 4; readonly text: string }

/**
 * A real heading of the lesson's outline. The reading frame (`MarkdownArticle`, 0.37.14) sets `h2` to `h4` at 14 (bold, then semibold, then muted), so the level
 * is the semantics and the weight is the frame's.
 */
const HeadingOf = (props: HeadingOfProps) => {
    if (props.level === 2) return <h2>{props.text}</h2>
    return props.level === 3 ? <h3>{props.text}</h3> : <h4>{props.text}</h4>
}

/** One block of the body, drawn with the grammar's own parts. */
const BodyBlock = (props: BlockProps) => {
    const { block } = props
    switch (block.kind) {
        case "heading":
            return <HeadingOf level={block.level} text={block.text} />
        case "paragraph":
            return (
                <Text as="p" isLoading={props.isLoading}>
                    <Runs runs={block.runs} />
                </Text>
            )
        case "quote":
            return (
                <Text as="p" tone="muted">
                    <Runs runs={block.runs} />
                </Text>
            )
        case "list":
            return (
                <Stack gap="inline">
                    {block.items.map((item, index) => (
                        <Text as="p" key={item.id} startContent={markerOf(block.isOrdered, index)}>
                            <Runs runs={item.runs} />
                        </Text>
                    ))}
                </Stack>
            )
        case "code":
            return (
                <FencedCodeBlock
                    code={block.code}
                    {...(block.language === "" ? {} : { language: block.language })}
                    isLoading={props.isLoading}
                />
            )
        case "mermaid":
            return (
                <MermaidDiagram
                    source={block.source}
                    label={props.diagramLabel}
                    errorTitle={props.diagramErrorTitle}
                    height="md"
                    isLoading={props.isLoading}
                />
            )
    }
}

/** The plain words of a paragraph or a quote, for comparing one with another. */
const wordsOf = (block: MarkdownBlock): string =>
    block.kind === "paragraph" || block.kind === "quote"
        ? block.runs
              .map((run) => run.text)
              .join("")
              .trim()
        : ""

/** The blocks with one caption per diagram: a lead-in paragraph that says what the quote under the diagram says is dropped, the quote stays as the caption. */
const withOneCaption = (blocks: ReadonlyArray<MarkdownBlock>): ReadonlyArray<MarkdownBlock> =>
    blocks.filter((block, index) => {
        const next = blocks[index + 1]
        const after = blocks[index + 2]
        return !(
            block.kind === "paragraph" &&
            next?.kind === "mermaid" &&
            after?.kind === "quote" &&
            wordsOf(block) !== "" &&
            wordsOf(block) === wordsOf(after)
        )
    })

/**
 * A lesson body: the markdown of a section read into headings, paragraphs, lists, fenced code and Mermaid diagrams, drawn in
 * the grammar's reading frame. A table or an unknown fence stays as code, so nothing of the teacher's text is dropped.
 */
export const MarkdownBody = (props: MarkdownBodyProps) => (
    <MarkdownArticle measure="reading">
        {withOneCaption(props.blocks).map((block) => (
            <BodyBlock
                key={block.id}
                block={block}
                diagramLabel={props.diagramLabel}
                diagramErrorTitle={props.diagramErrorTitle}
                isLoading={props.isLoading === true}
            />
        ))}
    </MarkdownArticle>
)
