import { createHash } from "node:crypto"
import { z } from "zod"
import { COURSE_HINT_LEVELS, COURSE_LAB_SCHEMA } from "./course-lab.contracts"

/** The characters of the content hash a version label keeps: a standard names a lab by its lesson id and a version by what it holds. */
export const COURSE_LAB_LABEL_LENGTH = 12

const slug = z
    .string()
    .max(100)
    .regex(/^[a-z0-9][a-z0-9-]*$/u)

const localized = z.looseObject({ vi: z.string().min(1), en: z.string().min(1) })

/** A text the standard writes in Vietnamese and may leave without English. */
const roleText = z.looseObject({ vi: z.string().min(1), en: z.string().min(1).optional() })

const chaos = z.record(z.string().min(1), z.union([z.string(), z.number(), z.boolean()]))

const happyCase = z.looseObject({
    id: slug,
    title: localized,
    chaos,
    invariants: z.array(z.string().min(1)),
})

const unhappyCase = z.looseObject({
    id: slug,
    title: localized,
    chaos,
    invariants: z.array(z.string().min(1)),
    teaches: z.string().min(1),
    /** The interviewer's follow-up question this case answers, in the interviewer's voice (page 4 quotes it). */
    question: roleText.optional(),
    /** What the learner can do once the case is green, one plain line (page 1 ticks it). */
    can: roleText.optional(),
    /** What the learner did to fix it, one or two plain sentences (page 5 retells it). */
    did: roleText.optional(),
    /** What the customer gains from the fix, one plain sentence (page 5). */
    gain: roleText.optional(),
    /** The idea in two or three words, the header of this case's column in the production table (page 6); the title stands in without it. */
    short: roleText.optional(),
    /** The English name of the idea, shown on its own muted line on page 5 (a name to search the docs with). */
    englishName: z.string().min(1).optional(),
    hints: z.array(roleText).max(COURSE_HINT_LEVELS),
    hasReference: z.boolean(),
    /** The ladder rung (a tag such as `c1-compensate-reverse`) that fixes the case. Server-only, like `rungs`: never in a web view. */
    ref: z.string().min(1).optional(),
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
})

/** The label of one chaos switch of the lab, in both languages: the lab declares the words, the app draws them and holds none of its own. */
const chaosLabel = z.looseObject({ id: z.string().min(1), label: localized })

const dep = z.looseObject({ id: z.string().min(1), image: z.string().min(1), role: roleText })

/** How a production repository handles one unhappy case: the code does it, the platform does it, partly, not at all, or the team writes it by hand. */
export const PRODUCTION_SHOWS = ["yes", "engine", "partial", "no", "manual"] as const

/** One real, public repository page 6 sets the learner's file beside; its links are pinned to a commit. */
const productionRepo = z.looseObject({
    repo: z.string().min(1),
    lang: z.string().min(1),
    files: z.array(z.looseObject({ path: z.string().min(1), url: z.string().min(1) })).min(1),
    /** One key per unhappy case id and no other. */
    shows: z.record(z.string().min(1), z.enum(PRODUCTION_SHOWS)),
    note: roleText,
})

/** The interview scene page 1 opens with: the moment, the setup, the question the learner would fail today, the stumble and the promise. */
const hook = z.looseObject({
    /** A title for pages 1 to 4 that names no concept of the lesson (the REF rule); the catalog title is for pages 5 and 6. */
    title: roleText.optional(),
    when: roleText,
    setup: roleText,
    question: roleText,
    stumble: roleText,
    promise: roleText,
})

/** What pages 5 and 6 say that belongs to the lesson: the retelling, the plain definition, what no listed repository ships and the answer to the page-1 question. */
const closing = z.looseObject({
    retell: roleText,
    define: roleText,
    beyond: roleText,
    answer: roleText,
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
        /** The framework the services run on (`express`), the name of its icon on the architecture drawing; absent draws the runtime's. */
        framework: z.string().min(1).optional(),
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
    framework: z.looseObject({
        nestjs: z.looseObject({ map: z.array(z.looseObject({ from: z.string().min(1), to: z.string().min(1) })) }),
    }),
    /** The interview hook of page 1; absent in a record cut before the hook was (the page then opens on the summary alone). */
    hook: hook.optional(),
    /** The closing words of pages 5 and 6; absent in a record cut before they were. */
    closing: closing.optional(),
    /** The repositories page 6 compares the learner's file with; absent means the comparison is not shown. */
    production: z.array(productionRepo).optional(),
    /** The labels of the chaos switches the cases use; absent in a record cut before the lab declared them (a switch with no label is shown as its key and value). */
    chaos: z.array(chaosLabel).optional(),
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
 * record has them) name each tag once and hold every case's `ref` past the base rung: a case whose rung is missing, or is the base the
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
    return record.unhappy.every((each) => each.ref === undefined || tags.indexOf(each.ref) > 0)
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
