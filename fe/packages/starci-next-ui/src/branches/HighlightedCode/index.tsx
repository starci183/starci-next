"use client"

import { useMemo, useSyncExternalStore } from "react"
import { createHighlighterCore, createJavaScriptRegexEngine } from "react-shiki/core"

/** The code to draw and the language its fence names (`null` for a fence that names none). */
type HighlightedCodeProps = {
    readonly code: string
    readonly language: string | null
}

/** The Shiki themes as CSS variables: both are in the HTML, the document class picks one (see `globals.css`), so a theme switch never re-highlights. */
const THEMES = { light: "material-theme-lighter", dark: "material-theme-darker" } as const

/** The grammar every fence name maps to; a name outside this table is drawn as plain text, framed the same way. */
const GRAMMAR_OF: Readonly<Record<string, string>> = {
    ts: "typescript",
    typescript: "typescript",
    tsx: "typescript",
    js: "javascript",
    javascript: "javascript",
    jsx: "javascript",
    json: "json",
    bash: "shellscript",
    sh: "shellscript",
    shell: "shellscript",
    zsh: "shellscript",
    shellscript: "shellscript",
    terminal: "shellscript",
    sql: "sql",
    yaml: "yaml",
    yml: "yaml",
    diff: "diff",
    go: "go",
    golang: "go",
    java: "java",
    csharp: "csharp",
    cs: "csharp",
    "c#": "csharp",
}

type Highlighter = Awaited<ReturnType<typeof createHighlighterCore>>

/**
 * The one highlighter of the page: the JavaScript regex engine (no WebAssembly to fetch), the two themes and the grammars the lessons use. It
 * starts loading when this module is first imported, long before a lesson's text has arrived, so a block is coloured the moment it draws.
 */
const highlighterPromise: Promise<Highlighter> = createHighlighterCore({
    themes: [import("shiki/themes/material-theme-lighter.mjs"), import("shiki/themes/material-theme-darker.mjs")],
    langs: [
        import("shiki/langs/typescript.mjs"),
        import("shiki/langs/javascript.mjs"),
        import("shiki/langs/json.mjs"),
        import("shiki/langs/shellscript.mjs"),
        import("shiki/langs/sql.mjs"),
        import("shiki/langs/yaml.mjs"),
        import("shiki/langs/diff.mjs"),
        import("shiki/langs/go.mjs"),
        import("shiki/langs/java.mjs"),
        import("shiki/langs/csharp.mjs"),
    ],
    engine: createJavaScriptRegexEngine(),
})

/** The loaded highlighter, `null` until the promise settles (and after it fails: a block then stays plain). */
let loaded: Highlighter | null = null
const listeners = new Set<() => void>()
highlighterPromise.then(
    (highlighter) => {
        loaded = highlighter
        listeners.forEach((listener) => listener())
    },
    () => undefined,
)

const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
}
const readLoaded = (): Highlighter | null => loaded
/** The server (and the hydrating client) render plain code; the client then switches to the coloured HTML in the same commit it can. */
const readServer = (): Highlighter | null => null

/** The HTML of a coloured block, `null` when Shiki cannot draw it (a failure falls back to the plain code). */
const toHtml = (highlighter: Highlighter, code: string, language: string | null): string | null => {
    try {
        return highlighter.codeToHtml(code, {
            lang: GRAMMAR_OF[(language ?? "").toLowerCase()] ?? "text",
            themes: THEMES,
            defaultColor: false,
        })
    } catch {
        return null
    }
}

/**
 * The body of a fenced code block, coloured by Shiki (material theme, light and dark as CSS variables) as soon as it draws: the highlighter loads at
 * import, so there is no viewport gating and no second pass. Grammar owns the frame, the language label, Copy and the scrolling (code scrolls, it does not wrap);
 * this draws only the code body, as the `renderCode` slot of Grammar's Markdown and the code view of a file. Before the highlighter is ready (the first
 * moments of the first page) it draws the plain `<pre><code>` in the same frame. It is a client file because the barrel of this package is also imported by
 * server layouts, and a hook may not load there.
 */
export const HighlightedCode = (props: HighlightedCodeProps) => {
    const highlighter = useSyncExternalStore(subscribe, readLoaded, readServer)
    const html = useMemo(
        () => (highlighter === null ? null : toHtml(highlighter, props.code, props.language)),
        [highlighter, props.code, props.language],
    )
    if (html === null) {
        return (
            <div data-grammar-fenced-code-highlight="true">
                <pre>
                    <code>{props.code}</code>
                </pre>
            </div>
        )
    }
    return <div data-grammar-fenced-code-highlight="true" dangerouslySetInnerHTML={{ __html: html }} />
}
