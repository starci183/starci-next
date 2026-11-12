"use client"

import { useEffect, useRef, useState } from "react"
import { useShikiHighlighter } from "react-shiki"

/** The code to draw and the language its fence names (`null` for a fence that names none). */
type HighlightedCodeProps = {
    readonly code: string
    readonly language: string | null
}

/** The Shiki themes: light by default, the dark one while the document is dark. */
const LIGHT_THEME = "material-theme-lighter"
const DARK_THEME = "material-theme-darker"

/** How far ahead of the viewport (in pixels) a block starts to be coloured. */
const NEAR_DISTANCE = 300

/** The plain code, shown before the block is coloured so a lesson reads at once. */
const PlainCode = (props: Pick<HighlightedCodeProps, "code">) => (
    <pre>
        <code>{props.code}</code>
    </pre>
)

/** The coloured code of a block that is near the viewport; the grammar of its language loads when this first draws. */
const Highlighted = (props: HighlightedCodeProps) => {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"))
    useEffect(() => {
        const root = document.documentElement
        const observer = new MutationObserver(() => setIsDark(root.classList.contains("dark")))
        observer.observe(root, { attributes: true, attributeFilter: ["class"] })
        return () => observer.disconnect()
    }, [])
    const node = useShikiHighlighter(props.code, props.language ?? "text", isDark ? DARK_THEME : LIGHT_THEME)
    if (node === null || node === undefined) return <PlainCode code={props.code} />
    return <div data-grammar-fenced-code-highlight="true">{node}</div>
}

/**
 * The body of a fenced code block, coloured by Shiki (material theme, light or dark with the document) once it is near the viewport. Until
 * then it is the plain `<pre><code>`. Grammar owns the frame, the language label, Copy and the scrolling (code scrolls, it does not wrap);
 * this draws only the code body, as the `renderCode` slot of Grammar's Markdown and the code view of a file. It is a client file because the
 * barrel of this package is also imported by server layouts, and a hook may not load there.
 */
export const HighlightedCode = (props: HighlightedCodeProps) => {
    const hostRef = useRef<HTMLDivElement>(null)
    const [isNear, setIsNear] = useState(() => typeof IntersectionObserver === "undefined")
    useEffect(() => {
        const host = hostRef.current
        if (host === null || isNear) return undefined
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting !== true) return
                setIsNear(true)
                observer.disconnect()
            },
            { rootMargin: `${NEAR_DISTANCE}px` },
        )
        observer.observe(host)
        return () => observer.disconnect()
    }, [isNear])
    return (
        <div ref={hostRef}>
            {isNear ? <Highlighted code={props.code} language={props.language} /> : <PlainCode code={props.code} />}
        </div>
    )
}
