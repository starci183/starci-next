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
 * (crash-mid-checkout, the lab's case id since the learner file became checkout.ts), an unanswered step is sent again with the same
 * key and, if it never answers, is marked unclear and undone first (timeout-ambiguous), the order id is the checkout's key
 * (double-checkout), and the email is a side step after every blocking step (pivot-email). Each is proven by an end-to-end case of that
 * repository.
 *
 * Transaction (ACID), read at essential-transaction-acid 413d783 (typescript/): the five writes of an order run on one connection inside
 * one shared `Database.transaction()` (het-hang-giua-chung); that helper ends every block with COMMIT or ROLLBACK before it hands the
 * connection back, and throws the connection away when even the ROLLBACK fails (don-loi-keo-don-sau); a broken database rule is read
 * by constraint name into a 422 OUT_OF_STOCK or INSUFFICIENT_FUNDS while any other fault stays a 500 (het-hang-noi-ro); the voucher runs
 * behind its own `Tx.savepoint`, and a code already used drops the discount while the order goes through (ma-giam-gia-da-dung). Each is
 * proven by an end-to-end spec of that repository (test/e2e/<case>.e2e-spec.ts).
 *
 * Idempotency key, read at essential-idempotency-key b12b967 (typescript/): `IdempotencyStore.run` stores the answer by key and replays
 * it marked replayed (mat-cau-tra-loi); the claim is an insert on the primary key (operation, key), so a second request waits for the
 * first and gets its answer (bam-hai-lan); a key is bound to a fingerprint of method, path and body and another body answers 422
 * KEY_REUSED (cung-khoa-khac-tien); a 402 refusal is stored like a success while a thrown error rolls the key back so the resend runs
 * (the-bi-tu-choi); claim, debit, ledger row and answer commit in one transaction (sap-giua-chung); and rows older than 24 hours are
 * deleted before every claim, so an expired key is a new request (khoa-qua-han). Each is proven by an end-to-end spec of that repository.
 */
export const COURSE_REFERENCE_COMPARISONS: Readonly<Record<string, CourseReferenceComparison>> = {
    "saga-compensation": {
        shows: {
            "out-of-stock": "partial",
            "flaky-undo": "yes",
            "refund-twice": "yes",
            "crash-mid-checkout": "yes",
            "timeout-ambiguous": "yes",
            "double-checkout": "yes",
            "pivot-email": "yes",
        },
        note: {
            vi: "Bản chuẩn của StarCi, đủ bảy tình huống. Khác bạn ở chỗ hết hàng sau khi đã trừ tiền: đơn dừng lại chờ xử lý, khách được báo thật, tiền chỉ hoàn khi nhân viên bấm huỷ đơn; lúc đó các bước gỡ chạy ngược như bước thường, mỗi bước có thử lại riêng.",
            en: "StarCi's standard, covering all seven cases. It differs from yours when stock runs out after the charge: the order stops on hold, the customer is told the truth, and the money comes back only when staff press cancel; the undo steps then run in reverse like ordinary steps, each with its own retries.",
        },
    },
    "checkout-transaction": {
        shows: {
            "het-hang-giua-chung": "yes",
            "don-loi-keo-don-sau": "yes",
            "het-hang-noi-ro": "yes",
            "ma-giam-gia-da-dung": "yes",
        },
        note: {
            vi: "Bản chuẩn của StarCi, đủ bốn tình huống. Khác bạn ở chỗ việc mở khối ghi, chốt, lùi lại và trả kết nối nằm trong một hàm dùng chung, code đặt hàng không tự mở khối; lùi lại mà cũng hỏng thì kết nối bị bỏ hẳn, không trả về. Mốc riêng cho mã giảm giá cũng là hàm dùng chung, còn lời từ chối đi qua một lớp lỗi riêng để thành 422.",
            en: "StarCi's standard, covering all four cases. Unlike yours, opening the block, committing, undoing and handing the connection back live in one shared helper, so checkout never opens a block itself; if even the undo fails, the connection is thrown away, not returned. The discount code's savepoint is a shared helper too, and refusals become a 422 through their own error class.",
        },
    },
    "payment-idempotency": {
        shows: {
            "mat-cau-tra-loi": "yes",
            "bam-hai-lan": "yes",
            "cung-khoa-khac-tien": "yes",
            "the-bi-tu-choi": "yes",
            "sap-giua-chung": "yes",
            "khoa-qua-han": "yes",
        },
        note: {
            vi: "Bản chuẩn của StarCi, đủ sáu tình huống. Khác bạn ở chỗ phần khóa là một kho dùng chung mà dịch vụ nào cũng gọi được: khóa đi kèm tên thao tác, dấu nội dung tính từ phương thức, đường dẫn và thân yêu cầu, còn lỗi mất kết nối cơ sở dữ liệu được trả 503 để shop gửi lại.",
            en: "StarCi's standard, covering all six cases. Unlike yours, the key logic is a shared store any service can call: keys are scoped per operation, the fingerprint covers method, path and body, and a lost database connection answers 503 so the shop sends again.",
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
