import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of attempt errors, Vietnamese and English. */
export const ATTEMPT_MESSAGES: MessageBundle = {
    vi: {
        "errors.ATTEMPT_NOT_FOUND": "Không tìm thấy lượt làm bài này.",
        "errors.ATTEMPT_REVISION_CONFLICT":
            "Bản làm bài này đã được gửi với câu trả lời khác; hãy gửi câu trả lời mới bằng số bản kế tiếp.",
        "errors.ATTEMPT_ANSWER_INVALID": "Câu trả lời không khớp với hoạt động này.",
        "errors.ATTEMPT_ACTIVITY_UNSUPPORTED": "Hoạt động này chưa nhận bài làm.",
        "errors.ATTEMPT_NOT_SAVED": "Không thể lưu lượt làm bài; hãy thử lại.",
        "errors.ATTEMPT_COACH_UNCONFIGURED": "Giáo viên AI chưa được cấu hình nên bài làm đã lưu nhưng chưa chấm.",
        "errors.ATTEMPT_COACH_UNAVAILABLE": "Giáo viên AI chưa phản hồi; bài làm đã lưu, bạn có thể chấm lại.",
        "errors.ATTEMPT_COACH_INVALID": "Kết quả chấm không hợp lệ nên không được lưu; bạn có thể chấm lại.",
        "errors.ATTEMPT_COACH_LIMIT_REACHED":
            "Bạn đã dùng hết lượt chấm bài bằng giáo viên AI của hôm nay; bài làm đã lưu và có thể chấm lại vào ngày mai.",
    },
    en: {
        "errors.ATTEMPT_NOT_FOUND": "This attempt was not found.",
        "errors.ATTEMPT_REVISION_CONFLICT":
            "This revision was already submitted with another answer; submit the new answer under the next revision.",
        "errors.ATTEMPT_ANSWER_INVALID": "The answer does not fit this activity.",
        "errors.ATTEMPT_ACTIVITY_UNSUPPORTED": "This activity does not take attempts yet.",
        "errors.ATTEMPT_NOT_SAVED": "The attempt could not be saved; try again.",
        "errors.ATTEMPT_COACH_UNCONFIGURED":
            "The AI teacher is not configured, so the answer is saved and not graded yet.",
        "errors.ATTEMPT_COACH_UNAVAILABLE":
            "The AI teacher did not answer; your answer is saved and can be graded again.",
        "errors.ATTEMPT_COACH_INVALID": "The grading result was not valid and was not stored; you can grade again.",
        "errors.ATTEMPT_COACH_LIMIT_REACHED":
            "You have used today's AI teacher gradings; your answer is saved and can be graded again tomorrow.",
    },
}
