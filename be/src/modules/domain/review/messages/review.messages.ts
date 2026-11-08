import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of review errors, Vietnamese and English. */
export const REVIEW_MESSAGES: MessageBundle = {
    vi: {
        "errors.REVIEW_ITEM_NOT_FOUND": "Không tìm thấy mục ôn tập này.",
        "errors.REVIEW_PREMIUM_REQUIRED": "Mục ôn tập này cần Premium.",
        "errors.REVIEW_REVISION_CONFLICT": "Lượt ôn này đã được ghi với đánh giá khác; hãy tải lại mục.",
        "errors.REVIEW_NOT_FLIPPED": "Hãy lật thẻ hoặc gửi câu trả lời của bạn trước khi tự đánh giá.",
        "errors.REVIEW_GRADE_INVALID": "Đánh giá phải là Quên, Khó, Nhớ hoặc Dễ.",
        "errors.REVIEW_ANSWER_INVALID": "Câu trả lời trống, quá dài hoặc không hợp với mục này.",
        "errors.REVIEW_DECK_NOT_FOUND": "Không tìm thấy bộ thẻ này.",
        "errors.REVIEW_DECK_IMMUTABLE": "Phiên bản bộ thẻ đã công bố không thể đổi nội dung.",
        "errors.REVIEW_DECK_INVALID": "Nguồn bộ thẻ có lỗi nên chưa được nhập.",
        "errors.REVIEW_GOAL_INVALID": "Mục tiêu mỗi ngày phải từ 5 đến 50 mục.",
        "errors.REVIEW_IMPORT_REJECTED": "Lệnh nhập bộ thẻ thiếu thư mục hoặc nhãn, hoặc nêu bộ thẻ không tồn tại.",
    },
    en: {
        "errors.REVIEW_ITEM_NOT_FOUND": "This review item was not found.",
        "errors.REVIEW_PREMIUM_REQUIRED": "This review item needs Premium.",
        "errors.REVIEW_REVISION_CONFLICT": "This review was already stored with another grade; reload the item.",
        "errors.REVIEW_NOT_FLIPPED": "Flip the card or submit your answer before you grade yourself.",
        "errors.REVIEW_GRADE_INVALID": "The grade must be Again, Hard, Good or Easy.",
        "errors.REVIEW_ANSWER_INVALID": "The answer is empty, too long or does not fit this item.",
        "errors.REVIEW_DECK_NOT_FOUND": "This deck was not found.",
        "errors.REVIEW_DECK_IMMUTABLE": "A published deck version cannot change its content.",
        "errors.REVIEW_DECK_INVALID": "The deck source has issues, so it was not imported.",
        "errors.REVIEW_GOAL_INVALID": "The daily goal must be between 5 and 50 items.",
        "errors.REVIEW_IMPORT_REJECTED":
            "The deck import lacks a directory or a ref, or names a deck that does not exist.",
    },
}
