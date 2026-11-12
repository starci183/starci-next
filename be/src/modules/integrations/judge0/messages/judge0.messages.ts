import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of Judge0 errors, Vietnamese and English. */
export const JUDGE0_MESSAGES: MessageBundle = {
    vi: {
        "errors.JUDGE0_CONFIG_INVALID": "Cấu hình máy chấm code không hợp lệ.",
        "errors.JUDGE0_NOT_CONFIGURED": "Máy chấm code chưa được cấu hình nên chưa chạy được bài.",
        "errors.JUDGE0_UNAVAILABLE": "Máy chấm code chưa phản hồi; hãy thử lại sau ít phút.",
        "errors.JUDGE0_REJECTED": "Máy chấm code từ chối bài làm; hãy thử lại.",
    },
    en: {
        "errors.JUDGE0_CONFIG_INVALID": "The code judge settings are not valid.",
        "errors.JUDGE0_NOT_CONFIGURED": "The code judge is not configured, so the problem cannot run yet.",
        "errors.JUDGE0_UNAVAILABLE": "The code judge did not answer; try again in a few minutes.",
        "errors.JUDGE0_REJECTED": "The code judge refused the submission; try again.",
    },
}
