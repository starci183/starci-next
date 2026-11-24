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

const dep = z.looseObject({ id: z.string().min(1), image: z.string().min(1), role: roleText })

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
    /** The learner file at every rung, base first; absent in a record cut before the rungs were (its cases then have no rung to serve). */
    rungs: z.array(rung).optional(),
})

/** One lab record, validated. */
export type CourseLabRecord = z.infer<typeof labRecord>

/** Why a record was refused: its shape, its key, or a reference inside it. */
export type CourseLabRefusal = "COURSE_LAB_RECORD_INVALID" | "COURSE_LAB_KEY_MISMATCH"

/** The answer of the record check: the record, or the code that refuses it. */
export type CourseLabCheck =
    | { readonly ok: true; readonly record: CourseLabRecord }
    | { readonly ok: false; readonly refusal: CourseLabRefusal }

/**
 * True when every case id is unique across both lists, every invariant a case names is declared in the record, and the rungs (when the
 * record has them) name each tag once and hold every case's `ref` past the base rung: a case whose rung is missing, or is the base the
 * learner already has, could never be diffed or reset honestly.
 */
const consistent = (record: CourseLabRecord): boolean => {
    const cases = [...record.happy, ...record.unhappy]
    if (new Set(cases.map((each) => each.id)).size !== cases.length) return false
    if (!cases.every((each) => each.invariants.every((id) => id in record.invariants))) return false
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

/** The SHA-256 (hex) of the canonical JSON of the record: the identity of its content. */
export const courseLabHashOf = (record: CourseLabRecord): string =>
    createHash("sha256")
        .update(JSON.stringify(canonicalOf(record)), "utf8")
        .digest("hex")

/** The version label of a content hash: its head. */
export const courseLabVersionOf = (hash: string): string => hash.slice(0, COURSE_LAB_LABEL_LENGTH)

/** True for a lesson id the doors accept: a lowercase slug. */
export const courseIdValid = (id: string): boolean => id.length <= 100 && /^[a-z0-9][a-z0-9-]*$/u.test(id)
