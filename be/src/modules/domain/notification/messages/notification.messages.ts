import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of notification errors, Vietnamese and English. */
export const NOTIFICATION_MESSAGES: MessageBundle = {
    vi: {
        "errors.NOTIFICATION_KIND_UNKNOWN": "Loại thông báo này không tồn tại.",
        "errors.NOTIFICATION_PARAMS_INVALID": "Thông tin kèm theo thông báo không hợp lệ.",
        "errors.NOTIFICATION_LINK_INVALID": "Đường dẫn của thông báo phải là một đường dẫn trong ứng dụng.",
        "errors.NOTIFICATION_CURSOR_INVALID": "Con trỏ trang không hợp lệ.",
        "errors.NOTIFICATION_MARK_INVALID": "Hãy chọn các thông báo cần đánh dấu đã đọc hoặc chọn tất cả.",
    },
    en: {
        "errors.NOTIFICATION_KIND_UNKNOWN": "This notification kind does not exist.",
        "errors.NOTIFICATION_PARAMS_INVALID": "The details of the notification are not valid.",
        "errors.NOTIFICATION_LINK_INVALID": "The link of a notification must be a path inside the app.",
        "errors.NOTIFICATION_CURSOR_INVALID": "The page cursor is not valid.",
        "errors.NOTIFICATION_MARK_INVALID": "Name the notifications to mark as read, or choose all.",
    },
}
