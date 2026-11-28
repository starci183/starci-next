import { createHash } from "node:crypto"
import { z } from "zod"
import { COURSE_HINT_LEVELS, COURSE_LAB_SCHEMA } from "./course-lab.contracts"

/** The characters of the content hash a version label keeps: a standard names a lab by its lesson id and a version by what it holds. */
export const COURSE_LAB_LABEL_LENGTH = 12

const slug = z
    .string()
    .max(100)
    .regex(/^[a-z0-9][a-z0-9-]*$/u)

/** A line the standard writes either as one Vietnamese string or as both languages; read as `{ vi, en? }` either way. */
const flexText = z
    .union([z.string().min(1), z.looseObject({ vi: z.string().min(1), en: z.string().min(1).optional() })])
    .transform((value): { vi: string; en?: string } => (typeof value === 'string' ? { vi: value } : { vi: value.vi, ...(value.en === undefined ? {} : { en: value.en }) }))

const localized = z.looseObject({ vi: z.string().min(1), en: z.string().min(1) })

/** A text the standard writes in Vietnamese and may leave without English. */
const roleText = z.looseObject({ vi: z.string().min(1), en: z.string().min(1).optional() })

const chaos = z.record(z.string().min(1), z.union([z.string(), z.number(), z.boolean()]))

/** The file and the lines a case checks (lessons.md §3): the page lights them in the learner's file when the case is picked. */
const focus = z.looseObject({ file: z.string().min(1), lines: z.array(z.number().int().min(1)) })

const happyCase = z.looseObject({
    id: slug,
    title: localized,
    chaos,
    invariants: z.array(z.string().min(1)),
    /**
     * The rung that fixes the case (`c0-naive`) when the starter (`c0-start`) is wrong in the normal cases by a line or two (lessons.md §3).
     * Server-only, like an unhappy case's `ref`.
     */
    ref: z.string().min(1).optional(),
    /** True when the ladder holds that rung: the case then has a diff (once green) and a reset, like an unhappy case. */
    hasReference: z.boolean().optional(),
    /** The hint levels of a normal case the starter breaks; absent means none. */
    hints: z.array(roleText).max(COURSE_HINT_LEVELS).optional(),
    focus: focus.optional(),
    /** The situation the case creates, one line of narration (inline markdown, lessons.md §9). */
    situation: flexText.optional(),
})

const unhappyCase = z.looseObject({
    id: slug,
    title: localized,
    chaos,
    invariants: z.array(z.string().min(1)),
    teaches: z.string().min(1),
    /** The interviewer's follow-up question this case answers, in the interviewer's voice (page 4 quotes it). */
    question: flexText.optional(),
    /** What page 5 says of the case once it is green: what the learner did, what the customer gains and the English name of the idea. */
    recap: z.looseObject({ did: flexText, gain: flexText, en: z.string().min(1) }).optional(),
    hints: z.array(roleText).max(COURSE_HINT_LEVELS),
    hasReference: z.boolean(),
    /** The ladder rung (a tag such as `c1-compensate-reverse`) that fixes the case. Server-only, like `rungs`: never in a web view. */
    ref: z.string().min(1).optional(),
    focus: focus.optional(),
    /** The situation the case creates, one line of narration (inline markdown, lessons.md §9). */
    situation: flexText.optional(),
})

/**
 * The learner file at one rung of the ladder. The standard writes every rung, base first, then the refs in teaching order, so "the rung
 * before" a case's own rung is the entry before it. Server-only: the learner's source holds the base rung alone, and the course door
 * hands out one rung per case (`course-rung.policy.ts`), so shipping the ladder never hands every answer to a learner on day 1.
 */
const rung = z.looseObject({ tag: z.string().min(1), content: z.string() })

const service = z.looseObject({
    id: z.string().min(1),
    port: z.number().int().min(1).max(65535),
    db: z.string().min(1).optional(),
    uses: z.array(z.string().min(1)).default([]),
    role: roleText,
    /** The name of the technology's logo on the drawing (`express`). */
    icon: z.string().min(1).optional(),
})

/** The label of one chaos switch of the lab, in both languages: the lab declares the words, the app draws them and holds none of its own. */
const chaosLabel = z.looseObject({ id: z.string().min(1), label: localized })

const dep = z.looseObject({ id: z.string().min(1), image: z.string().min(1), role: roleText, icon: z.string().min(1).optional() })

/** How a production repository handles one unhappy case: the code does it, the platform does it, partly, not at all, by hand, or the check could not tell. */
export const PRODUCTION_SHOWS = ["yes", "engine", "partial", "no", "manual", "unknown"] as const

/** One real, public repository page 6 sets the learner's file beside; its links are pinned to a commit. */
const productionRepo = z.looseObject({
    repo: z.string().min(1),
    lang: z.string().min(1),
    /** The day every file was opened and checked. */
    checked: z.string().min(1).optional(),
    files: z.array(z.looseObject({ path: z.string().min(1), url: z.string().min(1) })).min(1),
    /** One key per unhappy case id and no other. */
    shows: z.record(z.string().min(1), z.enum(PRODUCTION_SHOWS)),
    note: flexText,
})

/** The interview scene page 1 opens with: the moment, the scene, the question the learner would fail today, where they get stuck and the promise. */
const hook = z.looseObject({
    /** A title for pages 1 to 4 that names no concept of the lesson (the REF rule); the catalog title is for pages 5 and 6. */
    title: flexText.optional(),
    /** The moment of the interview; the page no longer draws it (owner 2026-11-28: "bỏ mấy từ này đi, ghi rõ CTO nivo.vn"). */
    when: flexText.optional(),
    /** Who asks the question ("Chị trưởng nhóm"): the page labels the question "<asker> hỏi"; absent, it reads a generic interviewer. */
    asker: localized.optional(),
    scene: flexText,
    question: flexText,
    stuck: flexText,
    promise: flexText,
})

/** One ticked line of page 1: what the learner can do, and the unhappy case id that teaches it (none for the last line). */
const outcome = z.looseObject({ can: flexText, case: z.string().min(1).optional() })

/** Page 5's opening: the line that points back to the interview question and the retelling, paragraph by paragraph. */
const recall = z.looseObject({ title: flexText, paragraphs: z.array(flexText).min(1) })

/**
 * One keyword of the narration (lessons.md §9, owner 2026-11-28) and its one plain sentence: the page draws the keyword with a dotted
 * underline where it first stands in a section and shows the sentence on hover or tap. `named` marks a keyword of the naming pages only
 * (the lesson's own concept): the REF rule keeps it off the pages before them.
 */
const termNote = z.looseObject({ vi: z.string().min(1), en: z.string().min(1).optional(), named: z.boolean().optional() })

/** What page 6 says that belongs to the lesson: what none of the listed repositories ships and the answer to the page-1 question. */
const closing = z.looseObject({ beyond: flexText, answer: flexText })

/** One endpoint of a service: its HTTP method and path (`POST /charges/:orderId/refund`). */
const endpoint = z.looseObject({ method: z.string().min(1), path: z.string().min(1) })

/** One HTTP request the learner file sends, numbered in the order it runs: who calls whom, the real endpoint, what it does and how it is reverted. */
const architectureRequest = z.looseObject({
    n: z.number().int().min(1),
    from: z.string().min(1),
    to: z.string().min(1),
    method: z.string().min(1),
    path: z.string().min(1),
    does: flexText,
    /** The endpoint the callee already has to revert the request, or null when nothing reverts it (an email sent). Not drawn by the page. */
    undo: endpoint.nullable().optional(),
})

/** A span of lines of a learner file, both ends included. */
const excerpt = z.looseObject({ from: z.number().int().min(1), to: z.number().int().min(1) })

/** The line of a learner file that sends one numbered request. */
const mark = z.looseObject({ line: z.number().int().min(1), request: z.number().int().min(1) })

/** One learner file of a lab of several (lessons.md §4, at most 3): its path, its role and, optionally, its own excerpt and marks. */
const learnerFileEntry = z.looseObject({
    path: z.string().min(1),
    role: flexText,
    excerpt: excerpt.optional(),
    marks: z.array(mark).optional(),
})

/**
 * What the static Kiến trúc page reads (lessons.md §7): the business flow, the requests the learner file sends, the tables of each
 * service's database, why the plain approach is not enough, and the learner file's excerpt with the line that sends each request.
 */
const architecture = z.looseObject({
    flow: z.array(z.looseObject({ vi: z.string().min(1), en: z.string().min(1).optional(), icon: z.string().min(1) })).min(1),
    requests: z.array(architectureRequest).min(1),
    tables: z.record(z.string().min(1), z.array(z.string().min(1))),
    why: flexText,
    learner: z.looseObject({
        /** What the starter does today; the page does not draw it (owner 2026-11-27). */
        now: flexText.optional(),
        excerpt,
        marks: z.array(mark),
        files: z.array(learnerFileEntry).min(1).max(3).optional(),
    }),
})

/** The lab@2 record of one lesson in the seed standard, key = lesson id. Loose, like the lesson record: the standard may add fields. */
const labRecord = z.looseObject({
    schema: z.literal(COURSE_LAB_SCHEMA).optional(),
    lessonId: slug,
    lab: z.string().min(1),
    concept: z.string().min(1),
    requires: z.array(z.string().min(1)),
    allowedTerms: z.array(z.looseObject({ id: z.string().min(1), term: z.string().min(1) })),
    stack: z.looseObject({
        language: z.string().min(1),
        runtime: z.string().min(1),
        test: z.string().min(1),
        /** Where the lab runs (`docker`): the group every part of the drawing stands in. */
        host: z.string().min(1).optional(),
        services: z.array(service).min(1),
        deps: z.array(dep),
    }),
    learnerFile: z.string().min(1),
    invariants: z.record(z.string().min(1), localized),
    happy: z.array(happyCase).min(1),
    unhappy: z.array(unhappyCase),
    grader: z.looseObject({
        matrix: z.looseObject({
            steps: z.array(z.string().min(1)).min(1),
            faults: z.array(z.string().min(1)).min(1),
        }),
    }),
    // Optional (lab@2): only a lesson with a framework version carries it; the Transaction (ACID) and Idempotency key labs have none.
    framework: z
        .looseObject({
            nestjs: z.looseObject({ map: z.array(z.looseObject({ from: z.string().min(1), to: z.string().min(1) })) }),
        })
        .optional(),
    /** The interview hook of page 1; absent in a record cut before the hook was (the page then opens on the summary alone). */
    hook: hook.optional(),
    /** The keywords of the narration, by the words they stand as in a sentence; absent in a record cut before the narration had them. */
    terms: z.record(z.string().min(1), termNote).optional(),
    /** The ticked outcomes of page 1; absent means one line per unhappy case title. */
    outcomes: z.array(outcome).optional(),
    /** The opening of page 5; absent in a record cut before it was. */
    recall: recall.optional(),
    /** The closing words of page 6; absent in a record cut before they were. */
    closing: closing.optional(),
    /** The repositories page 6 compares the learner's file with; absent means the comparison is not shown. */
    production: z.array(productionRepo).optional(),
    /** The labels of the chaos switches the cases use; absent in a record cut before the lab declared them (a switch with no label is shown as its key and value). */
    chaos: z.array(chaosLabel).optional(),
    /** The static Kiến trúc page; absent in a record cut before it was (the page then says it has nothing to show). */
    architecture: architecture.optional(),
    /** The learner file at every rung, base first; absent in a record cut before the rungs were (its cases then have no rung to serve). */
    rungs: z.array(rung).optional(),
})

/** One lab record, validated. */
export type CourseLabRecord = z.infer<typeof labRecord>

/** Why a record was refused: its shape, its key, or a reference inside it. */
export type CourseLabRefusal = "COURSE_LAB_RECORD_INVALID" | "COURSE_LAB_KEY_MISMATCH"

/** The answer of the record check: the record, or the code that refuses it. */
export type CourseLabCheck =
    { readonly ok: true; readonly record: CourseLabRecord } | { readonly ok: false; readonly refusal: CourseLabRefusal }

/** True when a production entry's `shows` has one key for every unhappy case id and no other. */
const showsMatch = (shows: Readonly<Record<string, string>>, unhappy: ReadonlyArray<{ readonly id: string }>): boolean => {
    const keys = Object.keys(shows)
    return keys.length === unhappy.length && unhappy.every((each) => each.id in shows)
}

/**
 * True when every case id is unique across both lists, every invariant a case names is declared in the record, and the rungs (when the
 * record has them) name each tag once and hold every case's `ref` (happy or unhappy) past the base rung: a case whose rung is missing, or is the base the
 * learner already has, could never be diffed or reset honestly.
 */
const consistent = (record: CourseLabRecord): boolean => {
    const cases = [...record.happy, ...record.unhappy]
    if (new Set(cases.map((each) => each.id)).size !== cases.length) return false
    if (!cases.every((each) => each.invariants.every((id) => id in record.invariants))) return false
    if (record.chaos !== undefined && new Set(record.chaos.map((each) => each.id)).size !== record.chaos.length) return false
    if (!(record.production ?? []).every((repo) => showsMatch(repo.shows, record.unhappy))) return false
    if (record.rungs === undefined) return true
    const tags = record.rungs.map((each) => each.tag)
    if (new Set(tags).size !== tags.length) return false
    // A happy case's rung (c0-naive) is past the base too: several normal cases may share it, so only its place is checked.
    return cases.every((each) => each.ref === undefined || tags.indexOf(each.ref) > 0)
}

/**
 * Judges the record a seed standard carries for one lab: the shape of lab@2, the key equal to the lesson id (a mismatch is refused,
 * never renamed), unique case ids and no case that names an invariant the record does not declare.
 */
export const courseLabCheckOf = (key: string, value: unknown): CourseLabCheck => {
    const parsed = labRecord.safeParse(value)
    if (!parsed.success || !consistent(parsed.data)) return { ok: false, refusal: "COURSE_LAB_RECORD_INVALID" }
    if (parsed.data.lessonId !== key) return { ok: false, refusal: "COURSE_LAB_KEY_MISMATCH" }
    return { ok: true, record: parsed.data }
}

/** The record with object keys in sorted order at every depth, so two equal records print the same bytes. */
const canonicalOf = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map((item) => canonicalOf(item))
    if (typeof value !== "object" || value === null) return value
    return Object.fromEntries(
        Object.entries(value)
            .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
            .map(([name, item]) => [name, canonicalOf(item)]),
    )
}

/** The SHA-256 (hex) of the canonical JSON of a value: the identity of its content. */
export const contentHashOf = (value: unknown): string =>
    createHash("sha256")
        .update(JSON.stringify(canonicalOf(value)), "utf8")
        .digest("hex")

/** The SHA-256 (hex) of the canonical JSON of the record: the identity of its content. */
export const courseLabHashOf = (record: CourseLabRecord): string => contentHashOf(record)

/** The version label of a content hash: its head. */
export const courseLabVersionOf = (hash: string): string => hash.slice(0, COURSE_LAB_LABEL_LENGTH)

/** True for a lesson id the doors accept: a lowercase slug. */
export const courseIdValid = (id: string): boolean => id.length <= 100 && /^[a-z0-9][a-z0-9-]*$/u.test(id)
