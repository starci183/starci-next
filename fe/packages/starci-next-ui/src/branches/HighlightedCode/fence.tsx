"use client"

import { useState, type ReactNode } from "react"
import { Button, FencedCodeBlock } from "@starci/grammar/common"
import { HighlightedCode } from "./index"

/** The words of the Copy command a fence draws when the caller gives no action of its own. */
export type HighlightedFenceCopy = { readonly copy: string; readonly copied: string }

/** What a coloured code block needs: Grammar's frame (header, path, note, action) around the code, and how its lines are drawn. */
export type HighlightedFenceProps = {
    readonly code: string
    readonly language?: string
    readonly label?: string
    readonly path?: string
    readonly note?: ReactNode
    readonly showLanguage?: boolean
    /** The action in the header; without it, `copy` draws a Copy command, and with neither the block has no action. */
    readonly action?: ReactNode
    readonly copy?: HighlightedFenceCopy
    readonly start?: number
    readonly lineNumbers?: boolean
    readonly highlightLines?: ReadonlyArray<number>
}

/** The Copy command of a fence: writes the code as written and says so. */
const CopyCode = (props: { readonly code: string; readonly words: HighlightedFenceCopy }) => {
    const [isCopied, setIsCopied] = useState(false)
    const copy = (): void => {
        navigator.clipboard
            .writeText(props.code)
            .then(() => setIsCopied(true))
            .catch(() => setIsCopied(false))
    }
    return (
        <Button variant="border" size="sm" onPress={copy}>
            {isCopied ? props.words.copied : props.words.copy}
        </Button>
    )
}

/**
 * Every code block of the app that shows code (owner: Shiki on every code block, drawn at once): Grammar's `FencedCodeBlock` frame with
 * the body coloured by {@link HighlightedCode}, so it falls under the `data-grammar-fenced-code-highlight` styles of the app's global
 * stylesheet; an excerpt of a file keeps its numbered and marked lines.
 */
export const HighlightedFence = (props: HighlightedFenceProps) => {
    const action =
        props.action ?? (props.copy === undefined ? undefined : <CopyCode code={props.code} words={props.copy} />)
    return (
        <FencedCodeBlock
            {...(props.language === undefined ? {} : { language: props.language })}
            {...(props.label === undefined ? {} : { label: props.label })}
            {...(props.path === undefined ? {} : { path: props.path })}
            {...(props.note === undefined ? {} : { note: props.note })}
            {...(props.showLanguage === undefined ? {} : { showLanguage: props.showLanguage })}
            {...(action === undefined ? {} : { action })}
        >
            <HighlightedCode
                code={props.code}
                language={props.language ?? null}
                {...(props.start === undefined ? {} : { start: props.start })}
                {...(props.lineNumbers === undefined ? {} : { lineNumbers: props.lineNumbers })}
                {...(props.highlightLines === undefined ? {} : { highlightLines: props.highlightLines })}
            />
        </FencedCodeBlock>
    )
}
