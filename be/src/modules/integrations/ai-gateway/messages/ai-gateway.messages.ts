import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of AI gateway errors, Vietnamese and English. */
export const AI_GATEWAY_MESSAGES: MessageBundle = {
    vi: {
        "errors.AI_GATEWAY_CONFIG_INVALID": "Cấu hình cổng AI không hợp lệ: {key}.",
        "errors.AI_GATEWAY_UNAVAILABLE": "Dịch vụ AI chưa phản hồi; hãy thử lại sau.",
        "errors.AI_GATEWAY_REPLY_EMPTY": "Dịch vụ AI trả lời trống; hãy thử lại sau.",
        "errors.AI_GATEWAY_NOT_CONFIGURED": "Dịch vụ AI chưa được cấu hình trên hệ thống này.",
    },
    en: {
        "errors.AI_GATEWAY_CONFIG_INVALID": "The AI gateway setting {key} is not valid.",
        "errors.AI_GATEWAY_UNAVAILABLE": "The AI service did not answer; try again later.",
        "errors.AI_GATEWAY_REPLY_EMPTY": "The AI service answered with no text; try again later.",
        "errors.AI_GATEWAY_NOT_CONFIGURED": "The AI service is not configured on this instance.",
    },
}
