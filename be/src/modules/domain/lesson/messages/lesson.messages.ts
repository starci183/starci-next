import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of lesson errors, Vietnamese and English. */
export const LESSON_MESSAGES: MessageBundle = {
    vi: {
        "errors.LESSON_NOT_FOUND": "Không tìm thấy mảnh kiến thức này.",
        "errors.LESSON_TOPIC_NOT_FOUND": "Không tìm thấy topic này.",
        "errors.LESSON_VERSION_IMMUTABLE": "Phiên bản này đã được xuất bản với nội dung khác và không thể đổi.",
        "errors.LESSON_CONTENT_INVALID":
            "Nội dung nguồn có lỗi nên không được nhập; xem nhật ký để biết tệp và trường.",
        "errors.LESSON_IMPORT_REJECTED":
            "Không thể nhập nội dung: thiếu thư mục hoặc nhãn phiên bản, hoặc thư mục không tồn tại.",
        "errors.LESSON_PREMIUM_REQUIRED": "Nội dung này cần gói Premium.",
    },
    en: {
        "errors.LESSON_NOT_FOUND": "This knowledge lesson was not found.",
        "errors.LESSON_TOPIC_NOT_FOUND": "This topic was not found.",
        "errors.LESSON_VERSION_IMMUTABLE": "This version is already published with other content and cannot change.",
        "errors.LESSON_CONTENT_INVALID":
            "The source content has problems and was not imported; the log names the files and fields.",
        "errors.LESSON_IMPORT_REJECTED":
            "The content cannot be imported: the directory or the version label is missing, or a folder does not exist.",
        "errors.LESSON_PREMIUM_REQUIRED": "This content needs a Premium plan.",
    },
}
