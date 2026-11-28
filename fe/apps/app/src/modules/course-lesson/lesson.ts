import type {
    CourseCasesQuery,
    CourseLessonAuditQuery,
    CourseLessonBeforeAfterQuery,
    CourseLessonQuery,
} from "@/modules/api"

/** The before-and-after block of one unhappy case, as its own query answers it; null when the record has none. */
export type CourseBeforeAfterRecord = CourseLessonBeforeAfterQuery["courseLesson"]["unhappy"][number]["beforeAfter"]

/** One case as the lesson query declares it. */
type CourseCaseRead = CourseLessonQuery["courseLesson"]["happy"][number]

/**
 * One case as the record declares it, with its before-and-after block once its own query answered (unhappy cases on a loop page); absent
 * elsewhere and before it arrives.
 */
export type CourseCaseSpec = CourseCaseRead & { readonly beforeAfter?: CourseBeforeAfterRecord }

/** The record of one course lesson. */
export type CourseLessonRecord = Omit<CourseLessonQuery["courseLesson"], "happy" | "unhappy"> & {
    readonly happy: ReadonlyArray<CourseCaseSpec>
    readonly unhappy: ReadonlyArray<CourseCaseSpec>
    /** The stored audit, read by its own query on the dev-only Audit tab; absent elsewhere and before it arrives. */
    readonly audit?: CourseLessonAuditQuery["courseLesson"]["audit"]
}

/** Where the learner stands in every case of a lesson. */
export type CourseCasesRecord = CourseCasesQuery["courseCases"]


/** One case as the learner stands in it. */
export type CourseCaseMark = CourseCasesRecord["cases"][number]

/** A loop of the lesson: its happy cases or its unhappy ones. */
export type CourseLoopKind = "happy" | "unhappy"

/** The states a case takes; a word the back end does not name counts as locked. */
export type CourseCaseState = "locked" | "open" | "red" | "green" | "error"

/** A case of the record with where the learner stands in it. */
export type CourseCase = {
    readonly id: string
    readonly kind: CourseLoopKind
    readonly spec: CourseCaseSpec
    /** Absent until the first read of the cases answers. */
    readonly mark: CourseCaseMark | undefined
    readonly state: CourseCaseState
}

/** The state of a mark; a read that has not answered counts every case as locked. */
const stateOf = (mark: CourseCaseMark | undefined): CourseCaseState => {
    const status = mark?.status
    if (status === "open" || status === "red" || status === "green" || status === "error") return status
    return "locked"
}

/** Every case of the record in the order the learner meets them: the happy ones, then the unhappy ones. */
export const casesOf = (
    lesson: CourseLessonRecord,
    marks: CourseCasesRecord | undefined,
): ReadonlyArray<CourseCase> => {
    const join = (kind: CourseLoopKind, specs: ReadonlyArray<CourseCaseSpec>): ReadonlyArray<CourseCase> =>
        specs.map((spec) => {
            const mark = marks?.cases.find((each) => each.caseId === spec.id)
            return { id: spec.id, kind, spec, mark, state: stateOf(mark) }
        })
    return [...join("happy", lesson.happy), ...join("unhappy", lesson.unhappy)]
}

/** The cases of one loop. */
export const loopOf = (cases: ReadonlyArray<CourseCase>, kind: CourseLoopKind): ReadonlyArray<CourseCase> =>
    cases.filter((each) => each.kind === kind)

/** True once the learner made a case green at least once: what opens the next case and the next page, never lowered by a later red run. */
export const isEverGreen = (each: CourseCase): boolean => each.mark?.everGreen === true

/**
 * True when the newest run of the case is green. A case that was green once and then broke counts as red here, the way the server's
 * submit gate counts it, so the counts the learner reads never promise a submission the server refuses.
 */
export const isGreenNow = (each: CourseCase): boolean => each.state === "green"

/** How many cases of a loop are green on their newest run. */
export const greenCountOf = (cases: ReadonlyArray<CourseCase>, kind: CourseLoopKind): number =>
    loopOf(cases, kind).filter((each) => isGreenNow(each)).length

/**
 * The case a loop opens on: the one the address names, else the case the back end calls current when it belongs to this loop, else the
 * first case that is not green yet, else the first.
 */
export const selectedCaseOf = (
    loop: ReadonlyArray<CourseCase>,
    named: string | undefined,
    currentId: string | null | undefined,
): CourseCase | undefined =>
    loop.find((each) => each.id === named) ??
    loop.find((each) => each.id === currentId) ??
    loop.find((each) => !isEverGreen(each) && each.state !== "locked") ??
    loop[0]

/** How many hints the learner opened across the lesson. */
export const hintsOpenedOf = (cases: ReadonlyArray<CourseCase>): number =>
    cases.reduce((total, each) => total + (each.mark?.hintsOpened ?? 0), 0)

/** The term of an id in the record's allowed terms; the id itself when the record gives no term. */
export const termOf = (lesson: CourseLessonRecord, id: string): string =>
    lesson.allowedTerms.find((each) => each.id === id)?.term ?? id
