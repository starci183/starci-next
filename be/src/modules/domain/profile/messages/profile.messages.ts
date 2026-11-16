import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of profile errors, Vietnamese and English. */
export const PROFILE_MESSAGES: MessageBundle = {
    vi: {
        "errors.PROFILE_NAME_INVALID": "Tên hiển thị phải có từ 1 đến {{max}} ký tự và không chứa ký tự điều khiển.",
        "errors.PROFILE_AVATAR_TYPE_NOT_ALLOWED": "Ảnh đại diện chỉ nhận PNG, JPEG hoặc WebP.",
        "errors.PROFILE_AVATAR_TOO_LARGE": "Ảnh đại diện quá lớn, tối đa {{maxBytes}} byte.",
        "errors.PROFILE_AVATAR_KEY_INVALID": "Ảnh này không thuộc về bạn.",
        "errors.PROFILE_AVATAR_NOT_UPLOADED": "Chưa thấy ảnh được tải lên, hãy thử lại.",
        "errors.PROFILE_AVATAR_UNAVAILABLE": "Kho ảnh chưa sẵn sàng, bạn thử lại sau nhé.",
    },
    en: {
        "errors.PROFILE_NAME_INVALID": "The display name must be 1 to {{max}} characters with no control characters.",
        "errors.PROFILE_AVATAR_TYPE_NOT_ALLOWED": "The avatar must be a PNG, JPEG or WebP image.",
        "errors.PROFILE_AVATAR_TOO_LARGE": "The avatar is too large, at most {{maxBytes}} bytes.",
        "errors.PROFILE_AVATAR_KEY_INVALID": "This image does not belong to you.",
        "errors.PROFILE_AVATAR_NOT_UPLOADED": "The image was not uploaded, please try again.",
        "errors.PROFILE_AVATAR_UNAVAILABLE": "The image store is not ready, please try again later.",
    },
}
