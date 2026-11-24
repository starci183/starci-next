import { HighlightedFence } from "../../branches/HighlightedCode/fence"
import {
    Disclosure,
    Markdown,
    Stack,
    Text,
    type CodeBlockLabels,
    type MarkdownCode,
    type MarkdownLabels,
    type MarkdownProps,
    type MarkdownTerm,
} from "@starci/grammar/common"
import type { ReactNode } from "react"
import { BODY_EMPHASIS_CLASS_NAME } from "./classNames"
import { parseDirectives, plainWordsOf, type DirectivePiece, type RichNode } from "./directives"
import { fileFencesOf } from "./fileFences"

export type { DirectivePiece } from "./directives"

/**
 * A drawing a caller adds for one container name (`run`, `lab`): the container as parsed and its content already drawn. It wins over
 * the built-in drawing of the same name.
 */
export type RichDrawing = (props: { readonly node: DirectivePiece; readonly inside: ReactNode }) => ReactNode

/** The body of a lesson, a problem, a hint or an answer: markdown that may hold `:::name` containers. */
type RichMarkdownProps = {
    /** The markdown, with or without `:::name{key="value"}` containers. */
    readonly source: string
    /** The words the rendered body speaks itself (Copy, diagrams, tables). */
    readonly labels?: MarkdownLabels
    /** The line length of the frame; reading by default. */
    readonly measure?: MarkdownProps["measure"]
    /** Draws the code body of a fence (syntax highlighting). */
    readonly renderCode?: (code: MarkdownCode) => ReactNode
    /** The first read has no data yet: the body draws as skeleton geometry and the placeholder words never show. */
    readonly isLoading?: boolean
    /** Extra container drawings by name, for a reader that knows more than the shared ones (the lesson's runs). */
    readonly drawings?: Readonly<Record<string, RichDrawing>>
    /** Copies the code of a fence that names its file; without it such a fence has no Copy action. */
    readonly onCopy?: (text: string) => void
    /** The words of a fence that names its file (Grammar's CodeBlock: Copy, line ranges). */
    readonly codeLabels?: Partial<CodeBlockLabels>
    /** Glossary terms the prose marks where they first stand (inside a Grammar `Sidenotes`). */
    readonly terms?: ReadonlyArray<MarkdownTerm>
}

/** What every piece is drawn with: the words, the line length and the code drawing of the body. */
type Context = Omit<RichMarkdownProps, "source" | "isLoading">

/** A list of pieces and the context to draw them in. */
type PiecesProps = { readonly nodes: ReadonlyArray<RichNode>; readonly context: Context }

/** One piece and the context to draw it in. */
type PieceProps = { readonly node: RichNode; readonly context: Context }

/** One container and the context to draw its content in. */
type DirectiveProps = { readonly node: DirectivePiece; readonly context: Context }

/** The pieces of a container, drawn one after another. */
const Pieces = (props: PiecesProps) =>
    props.nodes.map((node) => <Piece key={node.id} node={node} context={props.context} />)

/** What a muted line needs: its container. */
type MutedProps = { readonly node: DirectivePiece }

/** A `:::muted` container: a quiet line of words (the title of the section that follows). */
const MutedLine = (props: MutedProps) => (
    <Text as="p" tone="muted" role="label.item">
        {plainWordsOf(props.node.inside)}
    </Text>
)

/** A `:::panel` container: a folded section when it has a title, else its content as it is. */
const Panel = (props: DirectiveProps) => {
    const title = props.node.attrs["title"] ?? props.node.label
    const body = (
        <Stack gap="row">
            <Pieces nodes={props.node.inside} context={props.context} />
        </Stack>
    )
    return title === "" ? body : <Disclosure title={title} body={body} headingLevel={3} />
}

/** A container that folds nothing (an `:::accordion` of panels, or a name with no drawing): its content, without the colons. */
const Plain = (props: DirectiveProps) => (
    <Stack gap="row">
        <Pieces nodes={props.node.inside} context={props.context} />
    </Stack>
)

/** The drawing of one container name. */
type Drawing = (props: DirectiveProps) => ReactNode

/**
 * The containers the texts may use, by name. A name not listed draws its content without the colons, so a new container in the
 * data never shows raw syntax; adding a drawing for it is one entry here, never a change in a lesson.
 */
const DIRECTIVES: Readonly<Record<string, Drawing>> = {
    accordion: Plain,
    panel: Panel,
    muted: MutedLine,
}

/** A container drawn by the caller's drawing of its name, else the shared entry, else as plain content. */
const Directive = (props: DirectiveProps) => {
    const extra = props.context.drawings?.[props.node.name]
    if (extra !== undefined) {
        return extra({ node: props.node, inside: <Plain node={props.node} context={props.context} /> })
    }
    const Draw = DIRECTIVES[props.node.name] ?? Plain
    return <Draw node={props.node} context={props.context} />
}

/** What a fence that names its file needs. */
type FileFenceProps = {
    readonly language: string | null
    readonly file: string
    readonly start: number
    readonly highlight: ReadonlyArray<number>
    readonly code: string
    readonly context: Context
}

/**
 * A fence copied from a file of the source, Shiki-coloured in Grammar's fence, the file named in its header, the lines numbered from the file's own
 * first line and the marked lines tinted; its Copy writes the code as written.
 */
const FileFence = (props: FileFenceProps) => (
    <HighlightedFence
        code={props.code}
        path={props.file}
        start={props.start}
        lineNumbers
        {...(props.language === null ? {} : { language: props.language })}
        {...(props.highlight.length === 0 ? {} : { highlightLines: props.highlight })}
        copy={{ copy: props.context.codeLabels?.copy ?? "Copy", copied: props.context.codeLabels?.copied ?? "Copied" }}
    />
)

/** A run of markdown: the grammar's reader, with every fence that names its file drawn as a file excerpt. */
const MarkdownRun = (props: { readonly source: string; readonly context: Context }) => {
    const { context } = props
    return fileFencesOf(props.source).map((piece, index) =>
        piece.kind === "file" ? (
            <FileFence
                key={index}
                language={piece.language}
                file={piece.file}
                start={piece.start}
                highlight={piece.highlight}
                code={piece.code}
                context={context}
            />
        ) : (
            <Markdown
                key={index}
                source={piece.source}
                {...(context.labels === undefined ? {} : { labels: context.labels })}
                {...(context.measure === undefined ? {} : { measure: context.measure })}
                {...(context.renderCode === undefined ? {} : { renderCode: context.renderCode })}
                {...(context.terms === undefined ? {} : { terms: context.terms })}
            />
        ),
    )
}

/** One piece: markdown through the grammar's reader, a container through its drawing. */
const Piece = (props: PieceProps) => {
    const { node, context } = props
    if (node.kind === "directive") return <Directive node={node} context={context} />
    return <MarkdownRun source={node.source} context={context} />
}

/** The words a skeleton line is measured from: a line of body width. */
const SKELETON_WORDS = "x".repeat(72)

/** The body while the first read loads: three skeleton lines, never the placeholder words. */
const MarkdownSkeleton = () => (
    <Stack gap="row">
        <Text as="p" isLoading>
            {SKELETON_WORDS}
        </Text>
        <Text as="p" isLoading>
            {SKELETON_WORDS}
        </Text>
        <Text as="p" isLoading>
            {SKELETON_WORDS}
        </Text>
    </Stack>
)

/**
 * The one reader of every lesson, problem, hint and answer text. Plain markdown goes to the grammar's `Markdown`; a `:::name`
 * container (accordion, panel, muted) becomes the matching grammar part, read from the data with no per-lesson code.
 */
export const RichMarkdown = (props: RichMarkdownProps) => {
    const { source, isLoading, ...context } = props
    if (isLoading === true) return <MarkdownSkeleton />
    return (
        <div className={BODY_EMPHASIS_CLASS_NAME}>
            <Stack gap="row">
                <Pieces nodes={parseDirectives(source)} context={context} />
            </Stack>
        </div>
    )
}
