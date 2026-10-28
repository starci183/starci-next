import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of payOS rail errors, Vietnamese and English. */
export const PAYOS_MESSAGES: MessageBundle = {
    vi: {
        "errors.PAYOS_RAIL_NOT_CONFIGURED": "Kênh thanh toán payOS chưa được cấu hình.",
        "errors.PAYOS_SIGNATURE_INVALID": "Thông báo thanh toán payOS không đúng chữ ký.",
        "errors.PAYOS_PAYLOAD_MALFORMED": "Thông báo thanh toán payOS không đọc được.",
        "errors.PAYOS_PAYMENT_NOT_CONFIRMED": "payOS chưa xác nhận khoản thanh toán này.",
    },
    en: {
        "errors.PAYOS_RAIL_NOT_CONFIGURED": "The payOS payment rail is not configured on this instance.",
        "errors.PAYOS_SIGNATURE_INVALID": "The payOS payment notification failed signature verification.",
        "errors.PAYOS_PAYLOAD_MALFORMED": "The payOS payment notification could not be read.",
        "errors.PAYOS_PAYMENT_NOT_CONFIRMED": "payOS has not confirmed this payment.",
    },
}
