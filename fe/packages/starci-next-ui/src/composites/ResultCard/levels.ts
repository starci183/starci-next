import type { WrittenDraftView } from "../StudyBody/types"

/** The tone of a graded level: reached, half, not yet. */
export const toneOf = (level: number): "success" | "warning" | "muted" => {
    if (level >= 2) return "success"
    return level === 1 ? "warning" : "muted"
}

/** The words of a level, or the "no grade" words for -1. */
export const levelWordsOf = (level: number, words: readonly [string, string, string], none: string): string =>
    words[level] ?? none

/** A written card whose own grade rows are left out: the grade stands in the result card after it. */
export const ungraded = (draft: WrittenDraftView): WrittenDraftView => ({ ...draft, criteria: [], scoreLine: "" })
