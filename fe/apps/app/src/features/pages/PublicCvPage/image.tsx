import { readPublicCv } from "@/modules/api/server/publicCv"
import { siteUrl } from "@/modules/config"
import type { ReactElement } from "react"

/** The size every platform asks of a link preview. */
export const PUBLIC_CV_IMAGE_SIZE = { width: 1200, height: 630 } as const

/** The text alternative of the preview image. */
export const PUBLIC_CV_IMAGE_ALT = "StarCi Next"

/** How many signed lines the preview shows before "and N more". */
const SHOWN_LINES = 3

/** The words of the preview, resolved for the locale of the link. */
export type PublicCvImageWords = {
    readonly brand: string
    readonly badge: string
    readonly generic: string
    readonly trail: string
    readonly count: (count: number) => string
    readonly more: (count: number) => string
    readonly part: (part: string) => string
}

/** What the preview is built from: the link and the words. */
type PublicCvImageInput = {
    readonly slug: string
    readonly locale: string
    readonly words: PublicCvImageWords
}

/** The colours of the card: the light surface of the app. */
const INK = "#171717"
const MUTED = "#6b6b6b"
const BORDER = "#e5e5e5"
const ACCENT = "#e11d48"
const OK = "#047857"

/** The first letters of a name: up to two, from its first and last word. */
const initialsOf = (name: string): string => {
    const words = name
        .trim()
        .split(/\s+/u)
        .filter((word) => word !== "")
    const first = words[0]?.[0] ?? ""
    const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : ""
    return `${first}${last}`.toUpperCase()
}

/** The head every preview shares: the brand mark and the verified badge. */
const Head = (props: { readonly words: PublicCvImageWords }): ReactElement => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: ACCENT,
                    color: "#ffffff",
                    fontSize: 26,
                    fontWeight: 700,
                }}
            >
                S
            </div>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: INK }}>{props.words.brand}</div>
        </div>
        <div
            style={{
                display: "flex",
                padding: "8px 18px",
                borderRadius: 999,
                background: "#ecfdf5",
                color: OK,
                fontSize: 22,
                fontWeight: 600,
            }}
        >
            {props.words.badge}
        </div>
    </div>
)

/** The card around a preview: white, one hairline, the head on top and the address at the foot. */
const Card = (props: {
    readonly words: PublicCvImageWords
    readonly address: string
    readonly children: ReactElement
}): ReactElement => (
    <div
        style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: 56,
            background: "#ffffff",
            border: `2px solid ${BORDER}`,
            color: INK,
        }}
    >
        <Head words={props.words} />
        {props.children}
        <div style={{ display: "flex", fontSize: 22, color: MUTED }}>{props.address}</div>
    </div>
)

/** The preview of a link with no CV or a private one: the generic card, with no name and no sign that a CV exists. */
const genericOf = (words: PublicCvImageWords, address: string): ReactElement => (
    <Card words={words} address={address}>
        <div style={{ display: "flex", fontSize: 56, fontWeight: 700, lineHeight: 1.2 }}>{words.generic}</div>
    </Card>
)

/**
 * The 1200 by 630 preview of a public CV, read from the same `publicCv` the page reads: the initials, the name, the signed count and
 * sources, the first three lines with "and N more", and the trust trail. A missing, private or unreachable CV gets the generic card.
 */
export const publicCvImageOf = async (input: PublicCvImageInput): Promise<ReactElement> => {
    const address = `${new URL(siteUrl()).host}/cv/${input.slug}`
    const read = await readPublicCv(input.slug, input.locale)
    if (read.status !== "found") return genericOf(input.words, address)
    const { cv } = read
    const sources = [...new Set(cv.lines.map((line) => line.source))].map(input.words.part).join(", ")
    const lines = cv.lines.slice(0, SHOWN_LINES)
    const hidden = cv.lines.length - lines.length
    return (
        <Card words={input.words} address={address}>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 96,
                            height: 96,
                            borderRadius: 48,
                            background: "#f3f3f3",
                            fontSize: 38,
                            fontWeight: 700,
                        }}
                    >
                        {initialsOf(cv.displayName)}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", fontSize: 54, fontWeight: 700 }}>{cv.displayName}</div>
                        <div style={{ display: "flex", fontSize: 24, color: MUTED }}>
                            {[input.words.count(cv.lines.length), sources].filter((part) => part !== "").join(" · ")}
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {lines.map((line) => (
                        <div key={line.verificationCode} style={{ display: "flex", fontSize: 26, lineHeight: 1.3 }}>
                            {line.line.replaceAll("**", "")}
                        </div>
                    ))}
                    {hidden > 0 ? (
                        <div style={{ display: "flex", fontSize: 24, color: MUTED }}>{input.words.more(hidden)}</div>
                    ) : null}
                </div>
                <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: OK }}>{input.words.trail}</div>
            </div>
        </Card>
    )
}
