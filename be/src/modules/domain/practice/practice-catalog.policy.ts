import type { PracticeLocale } from "./practice.contracts"

/** One pattern of the catalog: its id (the data folder) and its title in each locale. */
export interface PracticePatternEntry {
    /** The pattern id, as the teacher's data names the domain. */
    readonly id: string
    /** The title by locale. */
    readonly titles: Readonly<Record<PracticeLocale, string>>
}

/** The twenty patterns of the teacher's problems in the order the learner meets them, from the basics to the heavier ones. */
export const PRACTICE_PATTERNS: ReadonlyArray<PracticePatternEntry> = [
    { id: "arrays", titles: { vi: "M\u1ea3ng", en: "Arrays" } },
    { id: "strings", titles: { vi: "Chu\u1ed7i", en: "Strings" } },
    { id: "hashing", titles: { vi: "B\u0103m (hash map)", en: "Hashing" } },
    { id: "twoPointers", titles: { vi: "Hai con tr\u1ecf", en: "Two pointers" } },
    { id: "slidingWindow", titles: { vi: "C\u1eeda s\u1ed5 tr\u01b0\u1ee3t", en: "Sliding window" } },
    { id: "sorting", titles: { vi: "S\u1eafp x\u1ebfp", en: "Sorting" } },
    { id: "binarySearch", titles: { vi: "T\u00ecm ki\u1ebfm nh\u1ecb ph\u00e2n", en: "Binary search" } },
    { id: "stack", titles: { vi: "Ng\u0103n x\u1ebfp", en: "Stack" } },
    { id: "queue", titles: { vi: "H\u00e0ng \u0111\u1ee3i", en: "Queue" } },
    { id: "linkedList", titles: { vi: "Danh s\u00e1ch li\u00ean k\u1ebft", en: "Linked list" } },
    { id: "recursion", titles: { vi: "\u0110\u1ec7 quy", en: "Recursion" } },
    { id: "backtracking", titles: { vi: "Quay lui", en: "Backtracking" } },
    { id: "trees", titles: { vi: "C\u00e2y", en: "Trees" } },
    { id: "heap", titles: { vi: "Heap", en: "Heap" } },
    { id: "graph", titles: { vi: "\u0110\u1ed3 th\u1ecb", en: "Graph" } },
    { id: "greedy", titles: { vi: "Tham lam", en: "Greedy" } },
    { id: "dynamicProgramming", titles: { vi: "Quy ho\u1ea1ch \u0111\u1ed9ng", en: "Dynamic programming" } },
    { id: "matrix", titles: { vi: "Ma tr\u1eadn", en: "Matrix" } },
    { id: "math", titles: { vi: "To\u00e1n", en: "Math" } },
    { id: "bitManipulation", titles: { vi: "Thao t\u00e1c bit", en: "Bit manipulation" } },
]

/** The ids of the patterns, in catalog order. */
export const PRACTICE_PATTERN_IDS: ReadonlyArray<string> = PRACTICE_PATTERNS.map((pattern) => pattern.id)

/** The position of a pattern in the catalog; unknown patterns sort last. */
export const patternPositionOf = (patternId: string): number => {
    const index = PRACTICE_PATTERN_IDS.indexOf(patternId)
    return index === -1 ? PRACTICE_PATTERN_IDS.length : index
}

/** The title of a pattern in a locale; an unknown pattern is titled by its id. */
export const patternTitleOf = (patternId: string, locale: PracticeLocale): string =>
    PRACTICE_PATTERNS.find((pattern) => pattern.id === patternId)?.titles[locale] ?? patternId
