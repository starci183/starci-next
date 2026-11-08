import { builder } from "@starci/jest-preset"
import type { ReviewLocale } from "@modules/domain/review"

/** One cloze of a card back. */
interface ClozeFixture {
    readonly n: number
    readonly term: string
    readonly distractors: ReadonlyArray<string>
}

/** The public front of a card in one locale. */
interface CardFrontFixture {
    readonly question: string
    readonly tags: ReadonlyArray<string>
}

/** The hidden back of a card in one locale. */
interface CardBackFixture {
    readonly answer: string
    readonly clozes: ReadonlyArray<ClozeFixture>
}

/** A file of a deck folder as the source reader returns it. */
export interface SourceFileFixture {
    readonly path: string
    readonly text: string
    readonly sha256: string
}

/** A learner's state for an item, as the review tables store it. */
export interface StateRowFixture {
    item_id: string
    source: "flashcard" | "retrieval"
    status: "new" | "learning" | "review" | "done" | "suspended"
    step: number
    due_on: string
    deck_id: string | null
    lesson_id: string | null
    activity_id: string | null
    lesson_version: string | null
    last_revision: number
    flipped_revision: number
}

/** A row of the queue: a state with what the list shows of its card or deck. */
export interface QueueRowFixture extends StateRowFixture {
    is_premium: boolean | null
    level: "junior" | "middle" | "senior" | "staff" | null
    deck_titles: Readonly<Record<ReviewLocale, string>> | null
}

/** A card of the live version of its deck. */
export interface CardRowFixture {
    item_id: string
    deck_id: string
    is_premium: boolean
    level: "junior" | "middle" | "senior" | "staff"
    langs: string | null
    front: Readonly<Record<ReviewLocale, CardFrontFixture>>
    back: Readonly<Record<ReviewLocale, CardBackFixture>>
    deck_titles: Readonly<Record<ReviewLocale, string>>
}

/** A learner nobody else uses in a unit spec. */
export const REVIEW_LEARNER = "10000000-0000-4000-8000-0000000000b1"

/** The marker line of the deck format. */
const MARK = "<!-- @starci/seperator -->"

/** Writes one plain field of a deck or card file. */
export const fieldOf = (name: string, value: string): string => `# ${name}\n${MARK}\n${value}\n${MARK}\n`

/** Writes one list field of a deck or card file. */
export const listOf = (name: string, values: ReadonlyArray<string>): string =>
    `# ${name}
${values.map((value, index) => itemOf(value, index)).join("")}`

/** Writes one item of a list field. */
const itemOf = (value: string, index: number): string => `## ${index}
${MARK}
${value}
${MARK}
`

/** The answer of the demo card in a locale, with one cloze. */
export const answerOf = (locale: string, term = "container"): string =>
    `:::muted\nTL;DR\n:::\n${locale} Handing creation to a {{c1::${term}::factory function,service locator}} buys testability.\n\n:::muted\nCommon pitfall\n:::\nA hand-built dependency.`

/** The text of a card file in one locale. */
export const cardTextOf = (
    locale: string,
    overrides: Partial<Record<"sortIndex" | "isPremium" | "level" | "answer" | "question" | "langs", string>> = {},
): string =>
    [
        fieldOf("sortIndex", overrides.sortIndex ?? "0"),
        fieldOf("isPremium", overrides.isPremium ?? "false"),
        fieldOf("question", overrides.question ?? `${locale} Why hand creation to a container?`),
        fieldOf("level", overrides.level ?? "junior"),
        listOf("tags", ["Dependency Injection", "Architecture"]),
        ...(overrides.langs === undefined ? [] : [fieldOf("langs", overrides.langs)]),
        fieldOf("answer", overrides.answer ?? answerOf(locale)),
    ].join("")

/** The text of a deck file in one locale. */
export const deckTextOf = (locale: string, sortIndex = "0"): string =>
    [
        fieldOf("sortIndex", sortIndex),
        fieldOf("title", `${locale} Module 1`),
        fieldOf("description", `${locale} Interview questions`),
        fieldOf("difficulty", "hard"),
        listOf("moduleRefs", ["0-nestjs-core-and-request-lifecycle"]),
    ].join("")

/** A source file with a hash derived from its path. */
export const sourceFileOf = (path: string, text: string): SourceFileFixture => ({
    path,
    text,
    sha256: `hash-of-${path}`,
})

/** The files of a small valid deck: the deck in both locales and two cards, one of them free. */
export const deckFilesOf = (): ReadonlyArray<SourceFileFixture> => [
    sourceFileOf("vi.md", deckTextOf("vi")),
    sourceFileOf("en.md", deckTextOf("en")),
    sourceFileOf("cards/0-card/vi.md", cardTextOf("vi")),
    sourceFileOf("cards/0-card/en.md", cardTextOf("en")),
    sourceFileOf(
        "cards/1-card/vi.md",
        cardTextOf("vi", { sortIndex: "1", isPremium: "true", level: "senior", langs: "go" }),
    ),
    sourceFileOf(
        "cards/1-card/en.md",
        cardTextOf("en", { sortIndex: "1", isPremium: "true", level: "senior", langs: "go" }),
    ),
]

/** A state row of a flashcard. */
export const stateRowOf: (overrides?: Partial<StateRowFixture>) => StateRowFixture = builder<StateRowFixture>({
    item_id: "card:0-fullstack-mastery/0-module-1/0",
    source: "flashcard",
    status: "new",
    step: -1,
    due_on: "2026-11-08",
    deck_id: "0-fullstack-mastery/0-module-1",
    lesson_id: null,
    activity_id: null,
    lesson_version: null,
    last_revision: 0,
    flipped_revision: 0,
})

/** A queue row of a flashcard. */
export const queueRowOf: (overrides?: Partial<QueueRowFixture>) => QueueRowFixture = builder<QueueRowFixture>({
    ...stateRowOf(),
    is_premium: false,
    level: "junior",
    deck_titles: { vi: "vi Module 1", en: "en Module 1" },
})

const FRONT: Record<"vi" | "en", CardFrontFixture> = {
    vi: { question: "vi Why?", tags: ["DI"] },
    en: { question: "en Why?", tags: ["DI"] },
}

const BACK: Record<"vi" | "en", CardBackFixture> = {
    vi: {
        answer: "vi A {{c1::container::factory,locator}} wins.",
        clozes: [{ n: 1, term: "container", distractors: ["factory", "locator"] }],
    },
    en: {
        answer: "en A {{c1::container::factory,locator}} wins.",
        clozes: [{ n: 1, term: "container", distractors: ["factory", "locator"] }],
    },
}

/** A card row of the live version of a deck. */
export const cardRowOf: (overrides?: Partial<CardRowFixture>) => CardRowFixture = builder<CardRowFixture>({
    item_id: "card:0-fullstack-mastery/0-module-1/0",
    deck_id: "0-fullstack-mastery/0-module-1",
    is_premium: false,
    level: "junior",
    langs: null,
    front: FRONT,
    back: BACK,
    deck_titles: { vi: "vi Module 1", en: "en Module 1" },
})
