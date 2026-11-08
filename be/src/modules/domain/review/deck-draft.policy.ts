import { createHash } from "node:crypto"
import { clozeProblems, parseClozes } from "./cloze.policy"
import { parseDeckFields, type DeckFields } from "./deck-format.policy"
import {
    REVIEW_LEVELS,
    REVIEW_LOCALES,
    type ReviewCardBack,
    type ReviewCardDraft,
    type ReviewCardFront,
    type ReviewDeckDraftResult,
    type ReviewIssue,
    type ReviewLevel,
    type ReviewLocale,
    type ReviewSourceFile,
} from "./review.contracts"

/** The outcome tracks that use the decks of a course folder (the proposed track map). */
const COURSE_TRACKS: Readonly<Record<string, ReadonlyArray<string>>> = {
    "0-fullstack-mastery": ["backend-fullstack", "ai-engineer", "founder"],
    "1-system-design-mastery": ["system-design-senior"],
    "2-devops-mastery": ["devops-sre"],
}

/** The tracks that use a course folder; none for a course the map does not name. */
export const tracksOfCourse = (course: string): ReadonlyArray<string> => COURSE_TRACKS[course] ?? []

/** The SHA-256 over the sorted path and hash lines of every source file. */
export const deckHashOf = (files: ReadonlyArray<ReviewSourceFile>): string =>
    createHash("sha256")
        .update(
            [...files]
                .sort((a, b) => a.path.localeCompare(b.path))
                .map((file) => `${file.path}\u0000${file.sha256}`)
                .join("\n"),
        )
        .digest("hex")

const CARD_FILE = /^cards\/([^/]+)\/(vi|en)\.md$/u

/** Collects the issues of one file under its path. */
class Issues {
    readonly list: Array<ReviewIssue> = []

    add(path: string, field: string, message: string): void {
        this.list.push({ path, field, message })
    }

    layout(path: string, fields: DeckFields): void {
        fields.problems.forEach((problem) => this.add(path, "", problem))
    }
}

const required = (issues: Issues, path: string, fields: DeckFields, name: string): string => {
    const value = fields.fields[name]?.trim()
    if (value === undefined || value === "") issues.add(path, name, `field ${name} is missing or empty`)
    return value ?? ""
}

const integer = (issues: Issues, path: string, fields: DeckFields, name: string): number => {
    const value = required(issues, path, fields, name)
    if (value !== "" && !/^\d+$/u.test(value)) issues.add(path, name, `field ${name} is not a whole number`)
    return Number(value) || 0
}

const bare = (slug: string): string => slug.replace(/^\d+-/u, "")

const byLocale = <T>(read: (locale: ReviewLocale) => T): Readonly<Record<ReviewLocale, T>> => ({
    vi: read("vi"),
    en: read("en"),
})

interface CardLocale {
    readonly sortIndex: number
    readonly isPremium: boolean
    readonly level: ReviewLevel
    readonly langs: string | null
    readonly front: ReviewCardFront
    readonly back: ReviewCardBack
}

/** The levels as plain text, to look up a value read from a file. */
const LEVEL_NAMES: ReadonlyArray<string> = REVIEW_LEVELS

const readCardLocale = (issues: Issues, path: string, text: string): CardLocale => {
    const fields = parseDeckFields(text)
    issues.layout(path, fields)
    const level = required(issues, path, fields, "level")
    if (level !== "" && !LEVEL_NAMES.includes(level))
        issues.add(path, "level", `level ${level} is not junior, middle, senior or staff`)
    const premium = required(issues, path, fields, "isPremium")
    if (premium !== "" && premium !== "true" && premium !== "false")
        issues.add(path, "isPremium", "isPremium is not true or false")
    const answer = required(issues, path, fields, "answer")
    const clozes = parseClozes(answer)
    clozeProblems(clozes).forEach((problem) => issues.add(path, "answer", problem))
    const langs = fields.fields["langs"]?.trim()
    return {
        sortIndex: integer(issues, path, fields, "sortIndex"),
        isPremium: premium === "true",
        level: REVIEW_LEVELS.find((known) => known === level) ?? "junior",
        langs: langs === undefined || langs === "" ? null : langs,
        front: {
            question: required(issues, path, fields, "question"),
            tags: (fields.lists["tags"] ?? []).map((tag) => tag.trim()).filter((tag) => tag !== ""),
        },
        back: { answer, clozes },
    }
}

const sameClozeNumbers = (issues: Issues, path: string, vi: CardLocale, en: CardLocale): void => {
    const numbers = (card: CardLocale): string => card.back.clozes.map((cloze) => cloze.n).join(",")
    if (numbers(vi) !== numbers(en)) issues.add(path, "answer", "vi and en have different cloze numbering")
    if (vi.level !== en.level) issues.add(path, "level", "vi and en have different levels")
    if (vi.isPremium !== en.isPremium) issues.add(path, "isPremium", "vi and en disagree on isPremium")
}

const readCards = (
    issues: Issues,
    deckId: string,
    files: ReadonlyMap<string, ReviewSourceFile>,
): ReadonlyArray<ReviewCardDraft> => {
    const folders = [
        ...new Set([...files.keys()].map((path) => CARD_FILE.exec(path)?.[1]).filter((name) => name !== undefined)),
    ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    const cards = folders.flatMap((folder): Array<ReviewCardDraft> => {
        const texts = byLocale((locale) => files.get(`cards/${folder}/${locale}.md`))
        if (texts.vi === undefined || texts.en === undefined) {
            const missing = REVIEW_LOCALES.filter((locale) => texts[locale] === undefined)
            issues.add(`cards/${folder}`, "", `missing ${missing.join(", ")}`)
            return []
        }
        const vi = readCardLocale(issues, `cards/${folder}/vi.md`, texts.vi.text)
        const en = readCardLocale(issues, `cards/${folder}/en.md`, texts.en.text)
        sameClozeNumbers(issues, `cards/${folder}`, vi, en)
        return [
            {
                itemId: `card:${deckId}/${vi.sortIndex}`,
                sortIndex: vi.sortIndex,
                isPremium: vi.isPremium,
                level: vi.level,
                langs: vi.langs,
                front: { vi: vi.front, en: en.front },
                back: { vi: vi.back, en: en.back },
            },
        ]
    })
    const seen = new Set<number>()
    cards.forEach((card) => {
        if (seen.has(card.sortIndex)) issues.add(`cards`, "sortIndex", `sortIndex ${card.sortIndex} appears twice`)
        seen.add(card.sortIndex)
    })
    return [...cards].sort((a, b) => a.sortIndex - b.sortIndex)
}

/**
 * Reads the files of one deck folder (both deck files and every card file), validates them and builds the draft to store, or
 * answers every issue found. The deck id is `<course>/<deck folder>`.
 */
export const buildDeckDraft = (
    course: string,
    folder: string,
    sourceFiles: ReadonlyArray<ReviewSourceFile>,
): ReviewDeckDraftResult => {
    const issues = new Issues()
    const deckId = `${course}/${folder}`
    const files = new Map(sourceFiles.map((file) => [file.path, file]))
    const deck = byLocale((locale) => {
        const file = files.get(`${locale}.md`)
        if (file === undefined) {
            issues.add(`${locale}.md`, "", "the deck file is missing")
            return undefined
        }
        const fields = parseDeckFields(file.text)
        issues.layout(file.path, fields)
        return {
            fields,
            sortIndex: integer(issues, file.path, fields, "sortIndex"),
            title: required(issues, file.path, fields, "title"),
            description: required(issues, file.path, fields, "description"),
            difficulty: required(issues, file.path, fields, "difficulty"),
        }
    })
    const cards = readCards(issues, deckId, files)
    if (cards.length === 0) issues.add("cards", "", "the deck has no card")
    if (issues.list.length > 0 || deck.vi === undefined || deck.en === undefined) {
        return { draft: null, issues: issues.list }
    }
    return {
        draft: {
            deckId,
            course,
            sortIndex: deck.vi.sortIndex,
            difficulty: deck.vi.difficulty,
            titles: { vi: deck.vi.title, en: deck.en.title },
            descriptions: { vi: deck.vi.description, en: deck.en.description },
            moduleRefs: (deck.vi.fields.lists["moduleRefs"] ?? []).map((slug) => bare(slug.trim())),
            tracks: tracksOfCourse(course),
            cards,
            sourceHashes: Object.fromEntries(sourceFiles.map((file) => [file.path, file.sha256])),
            contentHash: deckHashOf(sourceFiles),
        },
        issues: [],
    }
}
