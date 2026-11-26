import {
    LESSON_REFERENCES,
    type LessonReference,
    pinnedReferenceOfLesson,
    referenceCommandOf,
    referenceLanguageOf,
    referenceTreeUrlOf,
} from "@modules/platform/relay-protocol"
import type { CourseProductionShows, CourseReferenceView, CourseText } from "./course-lab.contracts"

/** How the standard reference of a lesson compares with the learner's file: one verdict per unhappy case, and one line in words. */
export interface CourseReferenceComparison {
    /** One key per unhappy case id of the lesson's lab and no other, judged from the reference's code at the pinned commit. */
    readonly shows: Readonly<Record<string, CourseProductionShows>>
    /** How the reference does it and how that differs from the learner's file. */
    readonly note: CourseText
}

/**
 * The comparison of each lesson's reference, keyed by lesson id. The reference's repository and commit are not here: they live once in
 * `LESSON_REFERENCES` (platform/relay-protocol), which the relay's `ref` command reads too.
 *
 * Saga, read at essential-saga 2bddb1d (typescript/): a refused step stops the run `failed` and a person presses the compensation
 * (out-of-stock: partial, the refund waits for that press); the undo runs on its own retry ladder (flaky-undo), every command carries
 * a fixed key the receiver claims with its effect (refund-twice), runs live in a versioned table that recovery moves on at start
 * (crash-mid-saga), an unanswered step is sent again with the same key and, if it never answers, is marked unclear and undone first
 * (timeout-ambiguous), the order id is the checkout's key (double-checkout), and the email is a side step after every blocking step
 * (pivot-email). Each is proven by an end-to-end case of that repository.
 */
export const COURSE_REFERENCE_COMPARISONS: Readonly<Record<string, CourseReferenceComparison>> = {
    "saga-compensation": {
        shows: {
            "out-of-stock": "partial",
            "flaky-undo": "yes",
            "refund-twice": "yes",
            "crash-mid-saga": "yes",
            "timeout-ambiguous": "yes",
            "double-checkout": "yes",
            "pivot-email": "yes",
        },
        note: {
            vi: "Bản chuẩn của StarCi, đủ bảy tình huống. Khác bạn ở chỗ hết hàng sau khi đã trừ tiền: đơn dừng lại chờ xử lý, khách được báo thật, tiền chỉ hoàn khi nhân viên bấm huỷ đơn; lúc đó các bước gỡ chạy ngược như bước thường, mỗi bước có thử lại riêng.",
            en: "StarCi's standard, covering all seven cases. It differs from yours when stock runs out after the charge: the order stops on hold, the customer is told the truth, and the money comes back only when staff press cancel; the undo steps then run in reverse like ordinary steps, each with its own retries.",
        },
    },
}

/** True when the comparison names every unhappy case of the lab and no other: a lab whose cases changed hides it until it is read again. */
export const comparisonMatches = (
    comparison: CourseReferenceComparison,
    unhappyIds: ReadonlyArray<string>,
): boolean => {
    const keys = Object.keys(comparison.shows)
    return keys.length === unhappyIds.length && unhappyIds.every((id) => id in comparison.shows)
}

/**
 * The standard reference page 6 shows for a lesson, or null: it is shown only on the named pages (every unhappy case green once), only
 * when the reference is pinned to a full commit, and only when its comparison matches the lab's unhappy cases.
 */
export const referenceViewOf = (
    lessonId: string,
    unhappyIds: ReadonlyArray<string>,
    isNamed: boolean,
    references: ReadonlyArray<LessonReference> = LESSON_REFERENCES,
    comparisons: Readonly<Record<string, CourseReferenceComparison>> = COURSE_REFERENCE_COMPARISONS,
): CourseReferenceView | null => {
    if (!isNamed) return null
    const reference = pinnedReferenceOfLesson(lessonId, references)
    const comparison = comparisons[lessonId]
    if (reference === undefined || comparison === undefined || !comparisonMatches(comparison, unhappyIds)) return null
    const language = referenceLanguageOf(reference, undefined)
    if (language === undefined) return null
    return {
        repo: reference.repo,
        commit: reference.commit,
        lang: language.label,
        url: referenceTreeUrlOf(reference, language),
        checked: reference.checked,
        command: referenceCommandOf(reference, language),
        shows: unhappyIds.map((caseId) => ({ caseId, value: comparison.shows[caseId] ?? "unknown" })),
        note: comparison.note,
    }
}
