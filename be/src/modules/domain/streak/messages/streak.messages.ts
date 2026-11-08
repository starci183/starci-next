import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of streak errors, Vietnamese and English. */
export const STREAK_MESSAGES: MessageBundle = {
    vi: {
        "errors.STREAK_ACTION_UNKNOWN": "Hành động này không được tính vào chuỗi học.",
        "errors.STREAK_GOAL_INVALID": "Mục tiêu tuần phải từ 2 đến 7 ngày và giờ nhắc phải có dạng HH:MM.",
    },
    en: {
        "errors.STREAK_ACTION_UNKNOWN": "This action does not count toward the streak.",
        "errors.STREAK_GOAL_INVALID": "The weekly goal must be 2 to 7 days and the reminder time must look like HH:MM.",
    },
}
