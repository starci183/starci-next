import { builder } from "@starci/jest-preset"
import { readJson } from "@tests/fixtures/builders/json.builder"
import {
    type BankDraft,
    type GradedQuestion,
    type GradingMaterial,
    type InterviewSourceFile,
    type QuestionDraft,
    type QuestionPublicRow,
    type SessionQuestion,
    type SessionRow,
    type TurnRow,
} from "@modules/domain/interview"
import type { EntityManager } from "typeorm"
import { sql } from "@modules/platform/database"
import { eachInOrder, isRecord } from "@modules/platform/primitives"

/** Removes every interview bank of the world, and with them their questions. */
export const DELETE_BANKS: ReturnType<typeof sql> = sql`DELETE FROM interview_banks`

/** Stores a published bank version of the world ($1 bank, $2 family, $3 course, $4 titles, $5 module refs, $6 question count). */
export const INSERT_BANK: ReturnType<typeof sql> =
    sql`INSERT INTO interview_banks (bank_id, version, content_hash, status, family, course, sort_index, difficulty, titles, descriptions, module_refs, question_count, calibration, imported_at, published_at)
VALUES ($1::text, 'v1', 'hash', 'published', $2::text, $3::text, 0, 'medium', $4::jsonb, $4::jsonb, $5::text[], $6::int, '{"mode":"world"}'::jsonb, now(), now())`

/** Stores one question of a world bank. */
export const INSERT_QUESTION: ReturnType<typeof sql> =
    sql`INSERT INTO interview_questions (bank_id, bank_version, question_id, sort_index, is_premium, family, tier, kind, tags, competency, leadership_tier, bodies, interviewer, grading)
VALUES ($1::text, 'v1', $2::text, $3::int, $4::boolean, $5::text, $6::text, $7::text, '{}'::text[], $8::text, NULL, $9::jsonb, $10::jsonb, $11::jsonb)`

/** The learner of the interview specs. */
export const LEARNER = "10000000-0000-4000-8000-000000000071"

/** The session of the interview specs. */
export const SESSION = "20000000-0000-4000-8000-000000000071"

/*
 * The Vietnamese texts of the fixtures, written as unicode escapes because source stays ASCII; the specs only need them to
 * differ from the English ones.
 */
const VI_BANK_TITLE = "Ng\u00e2n h\u00e0ng"
const VI_BEHAVIORAL_BANK_TITLE = "H\u00e0nh vi"
const VI_BANK_DESCRIPTION = "M\u00f4 t\u1ea3"
const VI_PROMPT = "Logic n\u00e0y thu\u1ed9c t\u1ea7ng n\u00e0o?"
const VI_FOLLOW_UP = "V\u00ec sao t\u1ea7ng \u0111\u00f3?"
const VI_HINT_ONE = "G\u1ee3i \u00fd m\u1ed9t"
const VI_HINT_TWO = "G\u1ee3i \u00fd hai"
const VI_IDEAL_ANSWER = "\u0110\u1eb7t trong service."

const MARK = "<!-- @starci/seperator -->"

/** A mount field: `# name`, the marker, the value, the marker. */
export const fieldOf = (name: string, value: string): string => `# ${name}\n${MARK}\n${value}\n${MARK}\n`

/** One plain item of a list field. */
const plainItemOf = (item: string, index: number): string => `## ${index}
${MARK}
${item}
${MARK}
`

/** A mount list field of plain items. */
export const listOf = (name: string, items: ReadonlyArray<string>): string =>
    `# ${name}
${items.map((item, index) => plainItemOf(item, index)).join("")}`

/** One sub-field of an object item. */
const subFieldOf = (key: string, value: string): string => `### ${key}
${MARK}
${value}
${MARK}
`

/** One object item of a list field. */
const objectItemOf = (item: Readonly<Record<string, string>>, index: number): string => {
    const subFields = Object.entries(item)
        .map(([key, value]) => subFieldOf(key, value))
        .join("")
    return `## ${index}
${subFields}`
}

/** A mount list field of objects with sub-fields. */
export const objectsOf = (name: string, items: ReadonlyArray<Readonly<Record<string, string>>>): string =>
    `# ${name}
${items.map((item, index) => objectItemOf(item, index)).join("")}`

/** Reads a JSON list of texts from a text override; anything else reads as an empty list. */
const textsOf = (raw: string): ReadonlyArray<string> => {
    const read = readJson(raw)
    if (read.kind === "failed" || !Array.isArray(read.value)) return []
    return read.value.flatMap((entry: unknown) => (typeof entry === "string" ? [entry] : []))
}

/** The text pairs of one record read from JSON. */
const textPairsOf = (entry: Readonly<Record<string, unknown>>): Array<[string, string]> =>
    Object.entries(entry).flatMap(([key, value]): Array<[string, string]> =>
        typeof value === "string" ? [[key, value]] : [],
    )

/** Reads a JSON list of flat text records from a text override; anything else reads as an empty list. */
const recordsOf = (raw: string): ReadonlyArray<Readonly<Record<string, string>>> => {
    const read = readJson(raw)
    if (read.kind === "failed" || !Array.isArray(read.value)) return []
    return read.value.flatMap((entry: unknown) => (isRecord(entry) ? [Object.fromEntries(textPairsOf(entry))] : []))
}

/** A source file of a bank folder. */
export const sourceOf = (path: string, text: string): InterviewSourceFile => ({ path, text, sha256: `h-${path}` })

const SAMPLES = JSON.stringify([
    { level: 1, answer: "full answer", sonnet: 100, haiku: 90 },
    { level: 2, answer: "good answer", sonnet: 70, haiku: 60 },
    { level: 3, answer: "thin answer", sonnet: 30, haiku: null },
    { level: 4, answer: "wrong answer", sonnet: 0, haiku: 0 },
    { level: 5, answer: "no answer", sonnet: null, haiku: null },
])

const CHECKLIST = [
    { text: "Names the layer", dimension: "technical", critical: "true", scoreBand: "60" },
    { text: "Explains the trade-off", dimension: "problemSolving", critical: "false", scoreBand: "40" },
]

/** The meta of a technical bank in one locale. */
export const bankMetaOf = (title: string, family = "technical", withRefs = true): string =>
    [
        fieldOf("sortIndex", "0"),
        fieldOf("title", title),
        fieldOf("description", `${title} description`),
        fieldOf("difficulty", "medium"),
        fieldOf("family", family),
        withRefs ? listOf("moduleRefs", ["0-core"]) : "",
    ].join("")

/** The question file of a technical question in one locale. */
export const technicalQuestionOf = (overrides: Readonly<Record<string, string>> = {}): string =>
    [
        fieldOf("sortIndex", overrides["sortIndex"] ?? "0"),
        fieldOf("isPremium", overrides["isPremium"] ?? "false"),
        fieldOf("family", "technical"),
        fieldOf("tier", overrides["tier"] ?? "junior"),
        fieldOf("kind", overrides["kind"] ?? "theory"),
        listOf("tags", ["layers"]),
        listOf("rubric", ["[technical] names the layer"]),
        objectsOf("checklist", overrides["checklist"] === undefined ? CHECKLIST : recordsOf(overrides["checklist"])),
        fieldOf("exampleResults", overrides["exampleResults"] ?? SAMPLES),
        listOf("followUps", ["Why that layer?"]),
        listOf("hints", ["Think about who owns the shape.", "Look at the error path."]),
        listOf("keywords", ["layer"]),
        overrides["diagram"] === undefined ? "" : fieldOf("diagram", overrides["diagram"]),
    ].join("")

/** The body file of a technical question in one locale. */
export const bodyOf = (lang: string, overrides: Readonly<Record<string, string>> = {}): string =>
    [
        fieldOf("lang", lang),
        fieldOf("prompt", overrides["prompt"] ?? "Where does this logic belong?"),
        overrides["givenCode"] === undefined ? "" : fieldOf("givenCode", overrides["givenCode"]),
        fieldOf("idealAnswer", ":::muted\nBottom line\n:::\nPut it in the service."),
    ].join("")

/** The question file of a behavioural question in one locale. */
export const behavioralQuestionOf = (overrides: Readonly<Record<string, string>> = {}): string =>
    [
        fieldOf("sortIndex", "0"),
        fieldOf("isPremium", "false"),
        fieldOf("family", "behavioral"),
        fieldOf("tier", "junior"),
        fieldOf("kind", overrides["kind"] ?? "behavioral"),
        fieldOf("competency", "conflict"),
        listOf("tags", ["Teamwork"]),
        fieldOf("prompt", "Tell me about a disagreement."),
        listOf(
            "rubric",
            overrides["rubric"] === undefined
                ? [
                      "[situationClarity] Sets the scene.",
                      "[actionSpecificity] Own actions.",
                      "[resultImpact] States the result.",
                      "[selfAwareness] Shows maturity.",
                      "[communication] Clear story.",
                      "[relevanceToRole] Fits the role.",
                  ]
                : textsOf(overrides["rubric"]),
        ),
        fieldOf("ownershipSignal", "Deduct for we-only action."),
        overrides["leadershipTier"] === undefined ? "" : fieldOf("leadershipTier", overrides["leadershipTier"]),
    ].join("")

/** The files of a valid technical bank with one question and one agnostic body. */
export const technicalFilesOf = (
    question: Readonly<Record<string, string>> = {},
): ReadonlyArray<InterviewSourceFile> => [
    sourceOf("vi.md", bankMetaOf(VI_BANK_TITLE)),
    sourceOf("en.md", bankMetaOf("Bank")),
    sourceOf("questions/0-question/vi.md", technicalQuestionOf(question)),
    sourceOf("questions/0-question/en.md", technicalQuestionOf(question)),
    sourceOf("questions/0-question/bodies/0-agnostic/vi.md", bodyOf("agnostic", { prompt: VI_PROMPT })),
    sourceOf("questions/0-question/bodies/0-agnostic/en.md", bodyOf("agnostic")),
]

/** The files of a valid behavioural bank with one question. */
export const behavioralFilesOf = (
    question: Readonly<Record<string, string>> = {},
): ReadonlyArray<InterviewSourceFile> => [
    sourceOf("vi.md", bankMetaOf(VI_BEHAVIORAL_BANK_TITLE, "behavioral", false)),
    sourceOf("en.md", bankMetaOf("Behavioral", "behavioral", false)),
    sourceOf("questions/0-question/vi.md", behavioralQuestionOf(question)),
    sourceOf("questions/0-question/en.md", behavioralQuestionOf(question)),
]

const material = (family: "technical" | "behavioral"): GradingMaterial =>
    family === "technical"
        ? {
              rubric: ["[technical] names the layer"],
              checklist: [
                  { text: "Names the layer", dimension: "technical", critical: true, scoreBand: 60 },
                  { text: "Explains the trade-off", dimension: "problemSolving", critical: false, scoreBand: 40 },
              ],
              keywords: ["layer"],
              star: [],
              ownershipSignal: null,
              exampleResults: [
                  { level: 1, answer: "full answer", sonnet: 100, haiku: 90 },
                  { level: 2, answer: "good answer", sonnet: 70, haiku: 60 },
              ],
          }
        : {
              rubric: [],
              checklist: [],
              keywords: [],
              star: [
                  { key: "situationClarity", text: "Sets the scene." },
                  { key: "actionSpecificity", text: "Own actions." },
                  { key: "resultImpact", text: "States the result." },
                  { key: "selfAwareness", text: "Shows maturity." },
                  { key: "communication", text: "Clear story." },
                  { key: "relevanceToRole", text: "Fits the role." },
              ],
              ownershipSignal: "Deduct for we-only action.",
              exampleResults: [],
          }

/** A question draft of either family. */
export const questionDraftOf: (overrides?: Partial<QuestionDraft>) => QuestionDraft = builder<QuestionDraft>({
    questionId: "0-fullstack-mastery/0-framework-foundation/0",
    sortIndex: 0,
    isPremium: false,
    family: "technical",
    tier: "junior",
    kind: "theory",
    tags: ["layers"],
    competency: null,
    leadershipTier: null,
    bodies: {
        agnostic: {
            vi: { prompt: VI_PROMPT, givenCode: null, diagram: null },
            en: { prompt: "Where does this logic belong?", givenCode: "const a = 1", diagram: null },
        },
    },
    interviewer: {
        vi: { followUps: [VI_FOLLOW_UP], hints: [VI_HINT_ONE, VI_HINT_TWO] },
        en: { followUps: ["Why that layer?"], hints: ["Hint one", "Hint two"] },
    },
    grading: {
        locales: { vi: material("technical"), en: material("technical") },
        ideal: { agnostic: { vi: VI_IDEAL_ANSWER, en: "Put it in the service." } },
    },
})

/** A behavioural question draft. */
export const behavioralDraftOf = (): QuestionDraft =>
    questionDraftOf({
        questionId: "eq/1-behavioral/0",
        family: "behavioral",
        kind: "behavioral",
        competency: "conflict",
        interviewer: { vi: { followUps: [], hints: [] }, en: { followUps: [], hints: [] } },
        grading: { locales: { vi: material("behavioral"), en: material("behavioral") }, ideal: {} },
    })

/** A bank draft. */
export const bankDraftOf: (overrides?: Partial<BankDraft>) => BankDraft = builder<BankDraft>({
    bankId: "0-fullstack-mastery/0-framework-foundation",
    course: "0-fullstack-mastery",
    family: "technical",
    sortIndex: 0,
    difficulty: "medium",
    titles: { vi: VI_BANK_TITLE, en: "Bank" },
    descriptions: { vi: VI_BANK_DESCRIPTION, en: "Description" },
    moduleRefs: ["0-core"],
    questions: [questionDraftOf()],
    skipped: 0,
    contentHash: "hash",
})

/** The technical grading material and the behavioural one. */
export const technicalMaterial: GradingMaterial = material("technical")
export const behavioralMaterial: GradingMaterial = material("behavioral")

/** A session question. */
export const sessionQuestionOf: (overrides?: Partial<SessionQuestion>) => SessionQuestion = builder<SessionQuestion>({
    position: 0,
    questionId: "0-fullstack-mastery/0-framework-foundation/0",
    bankId: "0-fullstack-mastery/0-framework-foundation",
    bankVersion: "v1",
    bodyLanguage: "agnostic",
    family: "technical",
})

/** A stored session row. */
export const sessionRowOf: (overrides?: Partial<SessionRow>) => SessionRow = builder<SessionRow>({
    session_id: SESSION,
    learner_id: LEARNER,
    client_request_id: "request-0001",
    track: "backend-fullstack",
    tier: "junior",
    locale: "vi",
    language: null,
    length: 2,
    access: "premium",
    free_month: null,
    questions: [
        sessionQuestionOf(),
        sessionQuestionOf({
            position: 1,
            questionId: "eq/1-behavioral/0",
            bankId: "eq/1-behavioral",
            family: "behavioral",
        }),
    ],
    current_position: 0,
    status: "active",
    scorecard: null,
    failure_code: null,
    graded_by: null,
    started_at: new Date("2026-11-08T10:00:00.000Z"),
    graded_at: null,
    overall_score: null,
    verdict: null,
})

/** A stored turn row. */
export const turnRowOf: (overrides?: Partial<TurnRow>) => TurnRow = builder<TurnRow>({
    turn_id: "30000000-0000-4000-8000-000000000001",
    session_id: SESSION,
    seq: 0,
    position: 0,
    role: "interviewer",
    kind: "prompt",
    content: VI_PROMPT,
    revision: null,
    by_ai: false,
    created_at: new Date("2026-11-08T10:00:01.000Z"),
})

/** The public row of a question as a session reads it. */
export const publicRowOf: (overrides?: Partial<QuestionPublicRow>) => QuestionPublicRow = builder<QuestionPublicRow>({
    bank_id: "0-fullstack-mastery/0-framework-foundation",
    bank_version: "v1",
    question_id: "0-fullstack-mastery/0-framework-foundation/0",
    family: "technical",
    tier: "junior",
    kind: "theory",
    bodies: questionDraftOf().bodies,
    interviewer: questionDraftOf().interviewer,
    bank_titles: { vi: VI_BANK_TITLE, en: "Bank" },
    module_refs: ["0-core"],
})

/** A grader reading of a technical question that hit the first checklist item only. */
export const gradedTechnicalOf: (overrides?: Partial<GradedQuestion>) => GradedQuestion = builder<GradedQuestion>({
    position: 0,
    checklist: [
        { item: 0, hit: true, evidenceQuote: "put it in the service" },
        { item: 1, hit: false, evidenceQuote: "" },
    ],
    dimensions: [],
    ownershipWeak: false,
    note: "Missed the trade-off.",
})

/** The technical bank of the interview worlds: the first Fullstack bank. */
export const TECHNICAL_BANK = "0-fullstack-mastery/0-framework-foundation"

/** The behavioural bank of the interview worlds. */
export const BEHAVIORAL_BANK = "eq/1-behavioral"

/** The Premium question of the technical bank, which a free session must never draw. */
export const PREMIUM_QUESTION: string = `${TECHNICAL_BANK}/9`

/** The words every scripted answer of a spec contains, so a grader quote can be taken from them. */
export const ANSWER_TEXT = "I would put it in the service layer and test the error path"

/**
 * Replaces the interview banks of the world with a published technical bank of three free junior questions and one Premium one, and
 * a published behavioural bank of one junior question. The questions are the builder drafts the unit specs use.
 */
export const persistInterviewBanks = async (manager: EntityManager | undefined): Promise<void> => {
    await manager?.query(DELETE_BANKS)
    const technical = bankDraftOf()
    const behavioral = behavioralDraftOf()
    const titles = JSON.stringify(technical.titles)
    await manager?.query(INSERT_BANK, [TECHNICAL_BANK, "technical", "0-fullstack-mastery", titles, ["0-core"], 4])
    await manager?.query(INSERT_BANK, [BEHAVIORAL_BANK, "behavioral", null, titles, [], 1])
    const rows = [
        ...[0, 1, 2, 9].map((n) => ({
            bank: TECHNICAL_BANK,
            id: `${TECHNICAL_BANK}/${n}`,
            n,
            premium: n === 9,
            draft: questionDraftOf(),
        })),
        { bank: BEHAVIORAL_BANK, id: `${BEHAVIORAL_BANK}/0`, n: 0, premium: false, draft: behavioral },
    ]
    await eachInOrder(rows, async (row) => {
        await manager?.query(INSERT_QUESTION, [
            row.bank,
            row.id,
            row.n,
            row.premium,
            row.draft.family,
            "junior",
            row.draft.kind,
            row.draft.competency,
            JSON.stringify(row.draft.bodies),
            JSON.stringify(row.draft.interviewer),
            JSON.stringify(row.draft.grading),
        ])
    })
}
