import type { MarkdownCode } from "@starci/grammar/common"
import { HighlightedCode } from "../../branches/HighlightedCode"

/** What the code block needs: the code of the fence and its language. */
type LessonCodeProps = { readonly code: MarkdownCode }

/** Fence names the lessons use for output, not code: drawn as plain text. */
const OUTPUT_LANGUAGES = new Set(["terminal", "output"])

/** A fenced code block of a lesson, drawn with syntax colour; a `terminal` fence (recorded output) stays plain text. */
export const LessonCode = (props: LessonCodeProps) => (
    <HighlightedCode
        code={props.code.value}
        language={OUTPUT_LANGUAGES.has(props.code.language ?? "") ? "text" : props.code.language}
    />
)
