import type { MarkdownCode } from "@starci/grammar/common"
import { HighlightedCode } from "@starci-next/ui"

/** The code body of every fenced block of a lesson: Shiki-coloured once it is near the viewport (the slot of Grammar's Markdown `renderCode`). */
export const renderLessonCode = (code: MarkdownCode) => <HighlightedCode code={code.value} language={code.language} />
