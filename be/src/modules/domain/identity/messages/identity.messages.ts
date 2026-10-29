import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of the identity codes, Vietnamese and English. */
export const IDENTITY_MESSAGES: MessageBundle = {
    vi: {
        "errors.IDENTITY_SESSION_REQUIRED": "Phiên đăng nhập không còn hiệu lực.",
        "errors.IDENTITY_SESSION_UNAVAILABLE": "Không thể truy cập phiên đăng nhập.",
        "errors.IDENTITY_PROVIDER_UNAVAILABLE": "Không thể kết nối dịch vụ đăng nhập.",
        "errors.IDENTITY_UNAUTHENTICATED":
            "B\u1ea1n c\u1ea7n \u0111\u0103ng nh\u1eadp \u0111\u1ec3 th\u1ef1c hi\u1ec7n thao t\u00e1c n\u00e0y.",
    },
    en: {
        "errors.IDENTITY_SESSION_REQUIRED": "A current session is required.",
        "errors.IDENTITY_SESSION_UNAVAILABLE": "Session state is unavailable.",
        "errors.IDENTITY_PROVIDER_UNAVAILABLE": "The sign-in provider is unavailable.",
        "errors.IDENTITY_UNAUTHENTICATED": "You need to sign in to do this.",
    },
}
