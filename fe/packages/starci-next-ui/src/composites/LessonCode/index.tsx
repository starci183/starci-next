import type { MarkdownCode } from "@starci/grammar/common"
import { HighlightedCode } from "../../branches/HighlightedCode"

/** What the code block needs: the code of the fence and its language. */
type LessonCodeProps = { readonly code: MarkdownCode }

/** A fenced code block of a lesson, drawn with syntax colour. */
export const LessonCode = (props: LessonCodeProps) => (
    <HighlightedCode code={props.code.value} language={props.code.language} />
)
