import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of payOS rail errors, Vietnamese and English. */
export const PAYOS_MESSAGES: MessageBundle = {
    vi: {
        "errors.PAYOS_RAIL_NOT_CONFIGURED": "Kênh thanh toán payOS chưa được cấu hình.",
        "errors.PAYOS_SIGNATURE_INVALID": "Thông báo thanh toán payOS không đúng chữ ký.",
        "errors.PAYOS_PAYLOAD_MALFORMED": "Thông báo thanh toán payOS không đọc được.",
        "errors.PAYOS_CHECKOUT_INVALID": "Không thể tạo liên kết thanh toán payOS cho đơn hàng này.",
        "errors.PAYOS_UNAVAILABLE": "payOS hiện không phản hồi.",
        "errors.PAYOS_CHECKOUT_REFUSED": "payOS đã từ chối tạo liên kết thanh toán.",
        "errors.PAYOS_CHECKOUT_OUTCOME_UNKNOWN":
            "Chưa xác định được liên kết thanh toán payOS của đơn hàng {{orderCode}}; cần đối soát theo mã đơn hàng này.",
    },
    en: {
        "errors.PAYOS_RAIL_NOT_CONFIGURED": "The payOS payment rail is not configured on this instance.",
        "errors.PAYOS_SIGNATURE_INVALID": "The payOS payment notification failed signature verification.",
        "errors.PAYOS_PAYLOAD_MALFORMED": "The payOS payment notification could not be read.",
        "errors.PAYOS_CHECKOUT_INVALID": "A payOS payment link cannot be created for this order.",
        "errors.PAYOS_UNAVAILABLE": "payOS is not answering.",
        "errors.PAYOS_CHECKOUT_REFUSED": "payOS refused to create the payment link.",
        "errors.PAYOS_CHECKOUT_OUTCOME_UNKNOWN":
            "The payOS payment link of order {{orderCode}} could not be confirmed; reconcile it by this order code.",
    },
}
