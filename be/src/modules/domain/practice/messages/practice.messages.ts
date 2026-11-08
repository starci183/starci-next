import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of practice errors, Vietnamese and English. */
export const PRACTICE_MESSAGES: MessageBundle = {
    vi: {
        "errors.PRACTICE_PROBLEM_NOT_FOUND": "Không tìm thấy bài này.",
        "errors.PRACTICE_PATTERN_NOT_FOUND": "Không tìm thấy nhóm bài này.",
        "errors.PRACTICE_SUBMISSION_NOT_FOUND": "Không tìm thấy lượt nộp này.",
        "errors.PRACTICE_PROBLEM_LOCKED": "Bài này thuộc gói Premium; mỗi nhóm bài mở sẵn một bài miễn phí.",
        "errors.PRACTICE_RATE_LIMITED":
            "Bạn đang chạy bài quá nhanh; hãy đợi lượt trước chấm xong hoặc thử lại sau ít giây.",
        "errors.PRACTICE_LANGUAGE_UNSUPPORTED": "Ngôn ngữ này chưa được hỗ trợ cho bài tập.",
        "errors.PRACTICE_SOURCE_TOO_LARGE": "Mã nguồn quá dài để nộp.",
        "errors.PRACTICE_SOURCE_EMPTY": "Bạn chưa viết mã nào.",
        "errors.PRACTICE_HINT_OUT_OF_ORDER": "Hãy mở các gợi ý theo thứ tự, từng bước một.",
        "errors.PRACTICE_NOT_SAVED": "Không thể lưu lượt nộp; hãy thử lại.",
        "errors.PRACTICE_CONTENT_INVALID": "Thư mục bài tập có lỗi nên chưa nhập được.",
        "errors.PRACTICE_VERSION_IMMUTABLE": "Phiên bản bài tập này đã lưu với nội dung khác.",
        "errors.PRACTICE_IMPORT_REJECTED": "Yêu cầu nhập bài tập không hợp lệ.",
    },
    en: {
        "errors.PRACTICE_PROBLEM_NOT_FOUND": "This problem was not found.",
        "errors.PRACTICE_PATTERN_NOT_FOUND": "This pattern was not found.",
        "errors.PRACTICE_SUBMISSION_NOT_FOUND": "This submission was not found.",
        "errors.PRACTICE_PROBLEM_LOCKED": "This problem is Premium; each pattern opens one problem for free.",
        "errors.PRACTICE_RATE_LIMITED":
            "You are running problems too fast; wait for the last run to finish or try again in a few seconds.",
        "errors.PRACTICE_LANGUAGE_UNSUPPORTED": "This language is not supported for practice.",
        "errors.PRACTICE_SOURCE_TOO_LARGE": "The source code is too long to submit.",
        "errors.PRACTICE_SOURCE_EMPTY": "You have not written any code yet.",
        "errors.PRACTICE_HINT_OUT_OF_ORDER": "Open the hints in order, one step at a time.",
        "errors.PRACTICE_NOT_SAVED": "The submission could not be saved; try again.",
        "errors.PRACTICE_CONTENT_INVALID": "The problem folder has issues, so it was not imported.",
        "errors.PRACTICE_VERSION_IMMUTABLE": "This problem version is already stored with other content.",
        "errors.PRACTICE_IMPORT_REJECTED": "The problem import request is not valid.",
    },
}
