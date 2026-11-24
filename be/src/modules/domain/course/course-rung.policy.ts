import { createHash } from "node:crypto"
import type { CourseLabRecord } from "./course-lab-record.policy"

/**
 * The ladder rungs of a lab, served one file at a time (owner 2026-11-25).
 *
 * A lab@2 lab is a git ladder: the base rung (c0, the naive code the learner starts from) and one rung per unhappy case that fixes it.
 * Shipping that ladder inside the learner's checkout would hand every reference answer, the last rung included, to the learner on day 1.
 * So the learner's source holds the base rung alone, and the server keeps the learner file of every rung and hands out one rung per case:
 * - the DIFF of a case spans the rung before it and its own rung, and opens only once the server recorded the case green for that learner
 *   (a comparison for someone who already solved it, never a shortcut past solving it);
 * - the RESET of a case hands out its own rung at any time, for a learner who is stuck, and is recorded as a `case.reset`, so the lesson
 *   page and the history say honestly where the fix came from.
 */

/** The prefix of a rung's kind: a rung is served as the kind `rung:<tag>`, one file, never a tarball. */
export const COURSE_RUNG_KIND_PREFIX = "rung:"

/** One rung's learner file as the door serves it. */
export interface CourseRungFile {
    /** `rung:<tag>`. */
    readonly kind: string
    /** The rung's tag, `c1-compensate-reverse`. */
    readonly tag: string
    /** The learner file's path in the lab, the record's `learnerFile`. */
    readonly path: string
    /** The file's text at that rung. */
    readonly content: string
    /** The SHA-256 (hex) of the text's UTF-8 bytes, so the relay can tell the file it writes is the file the server sent. */
    readonly sha256: string
}

/** One rung of the record: its tag and the learner file at it. */
interface Rung {
    readonly tag: string
    readonly content: string
}

/** The two rungs one unhappy case spans: the one before its fix (the base for the first unhappy case) and its own. */
export interface CourseRungSpan {
    /** The rung before the case's fix. */
    readonly previous: Rung
    /** The case's own rung: the reference fix. */
    readonly reference: Rung
}

/** Why a case has no span: no such case, or a case without a reference rung (a happy case, or a record cut before its rungs). */
export type CourseRungSpanRead =
    | { readonly kind: "span"; readonly span: CourseRungSpan }
    | { readonly kind: "no-case" }
    | { readonly kind: "no-rung" }

/**
 * The rungs a case spans. The record lists the rungs base first, then in teaching order, so the rung before a case's own rung is the
 * entry before it; a case whose `ref` is missing from the rungs, or is the base itself, has no span (the record check refuses that
 * shape too, this keeps the door honest on its own).
 */
export const rungSpanOf = (record: CourseLabRecord, caseId: string): CourseRungSpanRead => {
    const unhappy = record.unhappy.find((each) => each.id === caseId)
    if (unhappy === undefined) return record.happy.some((each) => each.id === caseId) ? { kind: "no-rung" } : { kind: "no-case" }
    const rungs = record.rungs ?? []
    const index = unhappy.ref === undefined ? -1 : rungs.findIndex((each) => each.tag === unhappy.ref)
    const previous = rungs[index - 1]
    const reference = rungs[index]
    if (!unhappy.hasReference || index < 1 || previous === undefined || reference === undefined) return { kind: "no-rung" }
    return { kind: "span", span: { previous, reference } }
}

/** What the diff door does with one asked rung of a case. */
export type CourseDiffDecision = "serve" | "locked" | "not-found"

/**
 * The diff door's rule: only the case's own two rungs are ever served under its name (asking for a later rung through an earlier case
 * finds nothing), and only once the server holds the case's ever-green mark. A run the learner's machine reported but StarCi never
 * received opens nothing: the mark is the server's record, never the client's word.
 */
export const diffDecisionOf = (span: CourseRungSpan, tag: string, everGreen: boolean): CourseDiffDecision => {
    if (tag !== span.previous.tag && tag !== span.reference.tag) return "not-found"
    return everGreen ? "serve" : "locked"
}

/** The rung of a span that has this tag; the caller checked it is one of the two. */
export const rungOfSpan = (span: CourseRungSpan, tag: string): Rung =>
    tag === span.previous.tag ? span.previous : span.reference

/** A rung as the door serves it: one file, named by the kind `rung:<tag>`, with the hash of its bytes. */
export const rungFileOf = (record: CourseLabRecord, rung: Rung): CourseRungFile => ({
    kind: `${COURSE_RUNG_KIND_PREFIX}${rung.tag}`,
    tag: rung.tag,
    path: record.learnerFile,
    content: rung.content,
    sha256: createHash("sha256").update(rung.content, "utf8").digest("hex"),
})
