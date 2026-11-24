import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of course errors, Vietnamese and English. */
export const COURSE_MESSAGES: MessageBundle = {
    vi: {
        "errors.COURSE_PREMIUM_REQUIRED": "Phòng lab của bài thuộc phần cần Premium.",
        "errors.COURSE_LESSON_NOT_FOUND": "Bài này chưa có phòng lab.",
        "errors.COURSE_CASE_NOT_FOUND": "Phòng lab không có ca này.",
        "errors.COURSE_CASE_LOCKED": "Ca này chưa mở: hãy làm xanh ca đứng trước nó.",
        "errors.COURSE_HINT_OUT_OF_ORDER": "Hãy mở gợi ý ở mức thấp hơn trước khi mở mức này.",
        "errors.COURSE_HINT_NOT_FOUND": "Ca này không có gợi ý ở mức đó.",
        "errors.COURSE_PAYLOAD_INVALID":
            "Dữ liệu gửi lên từ máy không hợp lệ hoặc nêu một ca không có trong phòng lab.",
        "errors.COURSE_RUNG_LOCKED": "Bản sửa tham chiếu của ca này chỉ mở sau khi StarCi đã ghi nhận ca xanh.",
        "errors.COURSE_RUNG_NOT_FOUND": "Ca này không có bậc tham chiếu đó.",
    },
    en: {
        "errors.COURSE_PREMIUM_REQUIRED": "The lab of this lesson belongs to a part that needs Premium.",
        "errors.COURSE_LESSON_NOT_FOUND": "This lesson has no lab yet.",
        "errors.COURSE_CASE_NOT_FOUND": "The lab has no such case.",
        "errors.COURSE_CASE_LOCKED": "This case is not open yet: make the case before it green first.",
        "errors.COURSE_HINT_OUT_OF_ORDER": "Open the hint of the level below before opening this one.",
        "errors.COURSE_HINT_NOT_FOUND": "This case has no hint at that level.",
        "errors.COURSE_PAYLOAD_INVALID":
            "The data sent from your machine is not valid or names a case the lab does not have.",
        "errors.COURSE_RUNG_LOCKED": "The reference fix of this case opens once StarCi has recorded the case green.",
        "errors.COURSE_RUNG_NOT_FOUND": "This case has no such reference rung.",
    },
}
