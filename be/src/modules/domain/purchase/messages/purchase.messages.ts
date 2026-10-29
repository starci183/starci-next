import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of purchase errors, Vietnamese and English. */
export const PURCHASE_MESSAGES: MessageBundle = {
    vi: {
        "errors.PURCHASE_PLAN_UNKNOWN": "Gói Premium này không tồn tại.",
        "errors.PURCHASE_CHECKOUT_REFUSED": "Không tạo được phiên thanh toán; hãy thử lại.",
        "errors.PURCHASE_CONFIRMATION_REFUSED": "Nhà cung cấp thanh toán không xác thực được thông báo này.",
        "errors.PURCHASE_DELIVERY_MALFORMED": "Thông báo thanh toán không đúng định dạng.",
        "errors.PURCHASE_ORDER_UNKNOWN": "Không tìm thấy đơn hàng mà thông báo thanh toán chỉ tới.",
        "errors.PURCHASE_CONFIRMATION_MISMATCH": "Thông báo thanh toán không khớp với đơn hàng.",
        "errors.PURCHASE_NOT_PAYABLE": "Đơn hàng không còn ở trạng thái có thể thanh toán.",
        "errors.PURCHASE_MISSING": "Không thể lưu giao dịch Premium.",
    },
    en: {
        "errors.PURCHASE_PLAN_UNKNOWN": "This Premium plan does not exist.",
        "errors.PURCHASE_CHECKOUT_REFUSED": "The payment checkout could not be created; please try again.",
        "errors.PURCHASE_CONFIRMATION_REFUSED": "The payment provider could not authenticate this notification.",
        "errors.PURCHASE_DELIVERY_MALFORMED": "The payment notification is malformed.",
        "errors.PURCHASE_ORDER_UNKNOWN": "The order the payment notification names was not found.",
        "errors.PURCHASE_CONFIRMATION_MISMATCH": "The payment notification does not match the order.",
        "errors.PURCHASE_NOT_PAYABLE": "The order is no longer payable.",
        "errors.PURCHASE_MISSING": "Could not save the Premium purchase.",
    },
}
