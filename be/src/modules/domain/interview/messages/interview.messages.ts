import type { MessageBundle } from "@modules/platform/i18n"
import type { Localized } from "../interview.contracts"

/** Display text of interview errors, Vietnamese and English. */
export const INTERVIEW_MESSAGES: MessageBundle = {
    vi: {
        "errors.INTERVIEW_SESSION_NOT_FOUND": "Không tìm thấy buổi phỏng vấn này.",
        "errors.INTERVIEW_PREMIUM_REQUIRED":
            "Bạn đã dùng buổi phỏng vấn miễn phí của tháng này. Nâng cấp Premium để phỏng vấn thêm.",
        "errors.INTERVIEW_SESSION_ACTIVE": "Bạn đang có một buổi phỏng vấn dở dang. Hãy tiếp tục hoặc bỏ buổi đó.",
        "errors.INTERVIEW_POOL_EMPTY": "Chưa đủ câu hỏi ở cấp này. Hãy thử cấp khác hoặc ngôn ngữ khác.",
        "errors.INTERVIEW_AI_LIMIT_REACHED":
            "Hôm nay bạn đã dùng hết lượt AI hợp lý. Câu trả lời đã được lưu, hãy quay lại ngày mai.",
        "errors.INTERVIEW_SETUP_INVALID": "Thiết lập buổi phỏng vấn không hợp lệ.",
        "errors.INTERVIEW_REVISION_CONFLICT": "Câu trả lời này đã được lưu với nội dung khác.",
        "errors.INTERVIEW_SESSION_CLOSED": "Buổi phỏng vấn đã kết thúc, không nhận thêm câu trả lời.",
        "errors.INTERVIEW_ANSWER_INVALID": "Câu trả lời không khớp với câu hỏi đang mở.",
        "errors.INTERVIEW_HINT_NONE_LEFT": "Câu này hết gợi ý.",
        "errors.INTERVIEW_NOTHING_TO_RETRY": "Không có bước nào cần thử lại.",
        "errors.INTERVIEW_NO_ANSWER": "Buổi phỏng vấn chưa có câu trả lời nào để chấm.",
        "errors.INTERVIEW_BANK_IMMUTABLE": "Phiên bản bộ câu hỏi này đã xuất bản với nội dung khác và không thể đổi.",
        "errors.INTERVIEW_BANK_INVALID":
            "Bộ câu hỏi nguồn có lỗi nên không được nhập; xem nhật ký để biết tệp và trường.",
        "errors.INTERVIEW_CALIBRATION_FAILED":
            "AI chấm lệch so với các bài mẫu của thầy nên bộ câu hỏi chưa được xuất bản.",
        "errors.INTERVIEW_IMPORT_REJECTED":
            "Không thể nhập bộ câu hỏi: thiếu thư mục hoặc nhãn phiên bản, hoặc bộ câu hỏi không tồn tại.",
        "errors.INTERVIEW_COACH_UNCONFIGURED": "Chưa cấu hình AI nên chưa chấm được. Câu trả lời đã được lưu.",
        "errors.INTERVIEW_COACH_UNAVAILABLE": "AI chưa trả lời kịp. Câu trả lời đã được lưu, hãy thử lại.",
        "errors.INTERVIEW_COACH_INVALID": "AI trả về kết quả không hợp lệ. Câu trả lời đã được lưu, hãy thử lại.",
    },
    en: {
        "errors.INTERVIEW_SESSION_NOT_FOUND": "This interview session was not found.",
        "errors.INTERVIEW_PREMIUM_REQUIRED":
            "You used this month's free interview. Upgrade to Premium to practise more.",
        "errors.INTERVIEW_SESSION_ACTIVE": "You already have an interview in progress. Resume it or abandon it.",
        "errors.INTERVIEW_POOL_EMPTY": "There are not enough questions at this level. Try another level or language.",
        "errors.INTERVIEW_AI_LIMIT_REACHED":
            "You reached today's fair-use limit of AI. Your answer is saved; come back tomorrow.",
        "errors.INTERVIEW_SETUP_INVALID": "The interview setup is not valid.",
        "errors.INTERVIEW_REVISION_CONFLICT": "This answer was already saved with other text.",
        "errors.INTERVIEW_SESSION_CLOSED": "The interview is over and takes no more answers.",
        "errors.INTERVIEW_ANSWER_INVALID": "The answer does not fit the open question.",
        "errors.INTERVIEW_HINT_NONE_LEFT": "This question has no hint left.",
        "errors.INTERVIEW_NOTHING_TO_RETRY": "Nothing is waiting for a retry.",
        "errors.INTERVIEW_NO_ANSWER": "The interview holds no answer to grade yet.",
        "errors.INTERVIEW_BANK_IMMUTABLE":
            "This bank version is already published with other content and cannot change.",
        "errors.INTERVIEW_BANK_INVALID":
            "The source bank has problems and was not imported; the log names the files and fields.",
        "errors.INTERVIEW_CALIBRATION_FAILED":
            "The AI grading drifted from the teacher's sample answers, so the bank is not published.",
        "errors.INTERVIEW_IMPORT_REJECTED":
            "The bank cannot be imported: the directory or the version label is missing, or the bank does not exist.",
        "errors.INTERVIEW_COACH_UNCONFIGURED":
            "No AI is configured, so this cannot be graded yet. Your answer is saved.",
        "errors.INTERVIEW_COACH_UNAVAILABLE": "The AI did not answer in time. Your answer is saved; try again.",
        "errors.INTERVIEW_COACH_INVALID": "The AI answered something invalid. Your answer is saved; try again.",
    },
}

/** The scripted lines of the interviewer that are not model output, by locale. */
export const INTERVIEW_SCRIPT: Readonly<Record<"done" | "skipped", Localized<string>>> = {
    done: {
        vi: "Cảm ơn bạn, đó là câu hỏi cuối cùng. Hãy gửi bài để được chấm một lượt cho cả buổi.",
        en: "Thank you, that was the last question. Submit to have the whole interview graded once.",
    },
    skipped: {
        vi: "(bỏ qua câu này)",
        en: "(skipped this question)",
    },
}

/** The display title of each outcome track, by locale. */
export const INTERVIEW_TRACK_TITLES: Readonly<
    Record<"devops-sre" | "system-design-senior" | "ai-engineer" | "founder" | "backend-fullstack", Localized<string>>
> = {
    "devops-sre": { vi: "DevOps / SRE", en: "DevOps / SRE" },
    "system-design-senior": { vi: "Thiết kế hệ thống (senior)", en: "System design (senior)" },
    "ai-engineer": { vi: "AI Engineer", en: "AI Engineer" },
    founder: { vi: "Khởi nghiệp", en: "Founder" },
    "backend-fullstack": { vi: "Backend / Fullstack", en: "Backend / Fullstack" },
}
