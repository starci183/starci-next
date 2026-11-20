import { Code } from "@starci/grammar/common"
import type { ReactNode } from "react"

/** The words of a question with its `inline code` spans drawn as Grammar `Code`, so a backtick never reaches the reader. */
export const withInlineCode = (text: string): ReactNode =>
    text
        .split(/`([^`]+)`/)
        .map((part, index) => (index % 2 === 1 ? <Code key={`${index}-${part}`}>{part}</Code> : part))
