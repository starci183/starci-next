import type { MarkdownCode } from "@starci/grammar/common"
import { MermaidDiagram } from "@starci/grammar/core/ext/graph"
import { HighlightedCode } from "../../branches/HighlightedCode"

/** The words of a lesson diagram: its accessible name and the title shown when its source does not parse. */
export type LessonDiagramLabels = { readonly label: string; readonly errorTitle: string }

/** What the code block needs: the code of the fence and its language; with `diagram`, a `mermaid` fence is drawn as a diagram. */
type LessonCodeProps = { readonly code: MarkdownCode; readonly diagram?: LessonDiagramLabels }

/** Fence names the lessons use for output, not code: drawn as plain text. */
const OUTPUT_LANGUAGES = new Set(["terminal", "output"])

/**
 * A fenced code block of a lesson, drawn with syntax colour; a `terminal` fence (recorded output) stays plain text. A `mermaid` fence is
 * the lesson's drawing, so it is drawn by Grammar's MermaidDiagram on the graph canvas (the routing law: no handle dots, straight or one bend,
 * top-down on a phone), never shown as its source.
 */
export const LessonCode = (props: LessonCodeProps) =>
    props.code.language === "mermaid" && props.diagram !== undefined ? (
        <MermaidDiagram source={props.code.value} label={props.diagram.label} errorTitle={props.diagram.errorTitle} />
    ) : (
        <HighlightedCode
            code={props.code.value}
            language={OUTPUT_LANGUAGES.has(props.code.language ?? "") ? "text" : props.code.language}
        />
    )
