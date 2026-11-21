"use client"

import { useFormatter, useTranslations } from "next-intl"
import { plainLineOf } from "./experience.shared"
import { useExperienceWords, type ExperienceWords } from "./useExperienceWords"

/** The words of the review queue and the review item: the experience words plus a day and month with the time of day. */
export interface ReviewWords extends ExperienceWords {
    /** A day and month with the time of day, e.g. 12/11, 09:20. */
    readonly moment: (iso: string) => string
}

/** What naming an item reads: its submitted and drafted lines and its subject. */
export type NamedItem = {
    readonly line: { readonly vi: string } | null
    readonly draftLine: { readonly vi: string } | null
    readonly subject: string
}

/** The name of an item under review: its line once drafted, else its subject. */
export const itemNameOf = (item: NamedItem): string => {
    const plain = plainLineOf((item.line ?? item.draftLine)?.vi ?? "")
    return plain === "" ? item.subject : plain
}

/** The marks that end the first clause of a CV line, where its short name stops: a ":" of a URL and a "." inside a word (Node.js) do not. */
const CLAUSE_END = /[;,(]|:(?!\/\/)|\.(?=\s|$)/

/** A web address and the short preposition before it (one to three letters, e.g. "at"): a heading stops before it, the address stays in the CV line. */
const URL_TAIL = /\s+(?:\S{1,3}\s+)?https?:\/\//i

/** The most characters a breadcrumb of an item keeps before it is cut on a word with an ellipsis. */
const CRUMB_MAX = 28

/** The short name of an item for its page heading: the first clause of its line before any web address, e.g. "Xây StarCi Shop bằng NestJS". */
export const itemShortNameOf = (item: NamedItem): string => {
    const name = itemNameOf(item)
    const clause = (name.split(CLAUSE_END)[0] ?? "").split(URL_TAIL)[0]?.trim() ?? ""
    return clause === "" ? name : clause
}

/** Cuts a name to at most {@link CRUMB_MAX} characters on a word boundary, ending with an ellipsis when it was cut. */
export const crumbOf = (name: string): string => {
    if (name.length <= CRUMB_MAX) return name
    const cut = name.slice(0, CRUMB_MAX)
    const space = cut.lastIndexOf(" ")
    return `${(space > 0 ? cut.slice(0, space) : cut).trimEnd()}…`
}

/** One day in milliseconds. */
const DAY_MS = 24 * 60 * 60 * 1000

/** Whole days from now to the deadline: positive while time is left, negative once it has passed, 0 on the day itself. */
export const daysUntil = (iso: string, now: number): number => {
    const left = new Date(iso).getTime() - now
    return left >= 0 ? Math.floor(left / DAY_MS) : -Math.ceil(-left / DAY_MS)
}

/** The parts the sidebar names: the review screens call them by the sidebar's words (Projects, not a translation). */
const SIDEBAR_PARTS = ["essentials", "projects", "harness", "practice"] as const

/** The parts a reviewer may be appointed to: the parts the sidebar names (the retired incidents is not one). */
export const REVIEW_PARTS: ReadonlyArray<string> = SIDEBAR_PARTS

/** A part the sidebar names. */
type SidebarPart = (typeof SIDEBAR_PARTS)[number]

/** Whether the sidebar names this part. */
const isSidebarPart = (part: string): part is SidebarPart => (SIDEBAR_PARTS as ReadonlyArray<string>).includes(part)

/** The review screens' words, built on the shared experience words, with the parts named as the sidebar names them. */
export const useReviewWords = (): ReviewWords => {
    const words = useExperienceWords()
    const t = useTranslations("app.experience")
    const nav = useTranslations("app.shell.nav")
    const format = useFormatter()
    return {
        ...words,
        part: (part) => (isSidebarPart(part) ? nav(part) : words.part(part)),
        moment: (iso) =>
            t("moment", {
                date: format.dateTime(new Date(iso), { day: "numeric", month: "numeric" }),
                time: format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit" }),
            }),
    }
}
