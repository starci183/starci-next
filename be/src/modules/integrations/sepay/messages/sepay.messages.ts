import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of SePay rail errors, Vietnamese and English. */
export const SEPAY_MESSAGES: MessageBundle = {
    vi: {
        "errors.SEPAY_RAIL_NOT_CONFIGURED": "Kênh thanh toán SePay chưa được cấu hình.",
        "errors.SEPAY_SECRET_INVALID": "Thông báo thanh toán SePay không đúng khóa bí mật.",
        "errors.SEPAY_PAYLOAD_MALFORMED": "Thông báo thanh toán SePay không đọc được.",
        "errors.SEPAY_CHECKOUT_INVALID": "Không thể tạo phiên thanh toán SePay cho đơn hàng này.",
    },
    en: {
        "errors.SEPAY_RAIL_NOT_CONFIGURED": "The SePay payment rail is not configured on this instance.",
        "errors.SEPAY_SECRET_INVALID": "The SePay payment notification failed secret key verification.",
        "errors.SEPAY_PAYLOAD_MALFORMED": "The SePay payment notification could not be read.",
        "errors.SEPAY_CHECKOUT_INVALID": "A SePay checkout cannot be started for this order.",
    },
}
