import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of relay errors, Vietnamese and English. */
export const RELAY_MESSAGES: MessageBundle = {
    vi: {
        "errors.RELAY_CODE_NOT_FOUND": "Mã ghép thiết bị không đúng hoặc đã hết hạn. Hãy chạy lại starci-next login.",
        "errors.RELAY_DEVICE_LIMIT": "Bạn đã ghép đủ số thiết bị cho phép. Hãy thu hồi một thiết bị rồi thử lại.",
        "errors.RELAY_PENDING": "Thiết bị chưa được xác nhận trên web.",
        "errors.RELAY_DEVICE_REVOKED":
            "Thiết bị này đã bị thu hồi hoặc chưa được ghép. Hãy chạy lại starci-next login.",
        "errors.RELAY_DEVICE_NOT_FOUND": "Không tìm thấy thiết bị này.",
        "errors.RELAY_PAIRING_INVALID": "Tên thiết bị hoặc hệ điều hành không hợp lệ.",
        "errors.RELAY_PAYLOAD_INVALID": "Dữ liệu gửi lên từ máy không hợp lệ hoặc quá lớn.",
        "errors.RELAY_UNAVAILABLE": "Chưa kết nối được tới máy chủ relay; hãy thử lại.",
    },
    en: {
        "errors.RELAY_CODE_NOT_FOUND": "The pairing code is wrong or has expired. Run starci-next login again.",
        "errors.RELAY_DEVICE_LIMIT": "You have paired as many devices as your plan allows. Revoke one and try again.",
        "errors.RELAY_PENDING": "The device has not been confirmed on the web yet.",
        "errors.RELAY_DEVICE_REVOKED": "This device was revoked or is not paired. Run starci-next login again.",
        "errors.RELAY_DEVICE_NOT_FOUND": "This device was not found.",
        "errors.RELAY_PAIRING_INVALID": "The device name or platform is not valid.",
        "errors.RELAY_PAYLOAD_INVALID": "What the machine sent is not valid or is too large.",
        "errors.RELAY_UNAVAILABLE": "The relay could not be reached; please try again.",
    },
}
