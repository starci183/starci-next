import { z } from "zod"
import { COURSE_COURSE_SCHEMA } from "./course-catalog.contracts"
import { contentHashOf, courseLabVersionOf } from "./course-lab-record.policy"

const slug = z
    .string()
    .max(100)
    .regex(/^[a-z0-9][a-z0-9-]*$/u)

const localized = z.looseObject({ vi: z.string().min(1), en: z.string().min(1) })

/** A node of the system map; `service` is absent for a node that is not one of the lab's services (a database the lesson draws). */
const node = z.looseObject({
    id: slug,
    service: z.string().min(1).optional(),
    label: localized,
    role: localized,
})

const edge = z.looseObject({ from: slug, to: slug })

const lesson = z.looseObject({
    id: slug,
    node: slug,
    concept: z.string().min(1),
    terms: z.array(z.string().min(1)),
})

/** The course record of the seed standard, key = course id. Loose, like the lab record: the standard may add fields. */
const courseRecord = z.looseObject({
    schema: z.literal(COURSE_COURSE_SCHEMA).optional(),
    id: slug,
    status: z.string().min(1),
    author: z.string().min(1),
    title: localized,
    summary: localized,
    lab: z.looseObject({ name: z.string().min(1) }),
    system: z.looseObject({ nodes: z.array(node), edges: z.array(edge) }),
    lessons: z.array(lesson),
})

/** One course record, validated. */
export type CourseRecord = z.infer<typeof courseRecord>

/** Why a record was refused: its shape or its key. */
export type CourseRecordRefusal = "COURSE_RECORD_INVALID" | "COURSE_KEY_MISMATCH"

/** The answer of the record check: the record, or the code that refuses it. */
export type CourseRecordCheck =
    { readonly ok: true; readonly record: CourseRecord } | { readonly ok: false; readonly refusal: CourseRecordRefusal }

const unique = (ids: ReadonlyArray<string>): boolean => new Set(ids).size === ids.length

/** True when node ids and lesson ids are unique, every edge joins two nodes and every lesson stands on a node of the system. */
const consistent = (record: CourseRecord): boolean => {
    const nodeIds = record.system.nodes.map((each) => each.id)
    if (!unique(nodeIds) || !unique(record.lessons.map((each) => each.id))) return false
    return (
        record.system.edges.every((each) => nodeIds.includes(each.from) && nodeIds.includes(each.to)) &&
        record.lessons.every((each) => nodeIds.includes(each.node))
    )
}

/**
 * Judges the record a seed standard carries for one course: the shape of the course record, the key equal to the course id (a mismatch is
 * refused, never renamed), unique node and lesson ids, and edges and lessons that name nodes the system has.
 */
export const courseRecordCheckOf = (key: string, value: unknown): CourseRecordCheck => {
    const parsed = courseRecord.safeParse(value)
    if (!parsed.success || !consistent(parsed.data)) return { ok: false, refusal: "COURSE_RECORD_INVALID" }
    if (parsed.data.id !== key) return { ok: false, refusal: "COURSE_KEY_MISMATCH" }
    return { ok: true, record: parsed.data }
}

/** The SHA-256 (hex) of the canonical JSON of the record: the identity of its content. */
export const courseRecordHashOf = (record: CourseRecord): string => contentHashOf(record)

/** The version label of a record hash: its head, the same label a lab version carries. */
export const courseRecordVersionOf = (hash: string): string => courseLabVersionOf(hash)

