import type { MessageBundle } from "@modules/platform/i18n"

/** Redacted display text for provider-boundary failures, Vietnamese and English. */
export const KEYCLOAK_MESSAGES: MessageBundle = {
    vi: {
        "errors.KEYCLOAK_UNAVAILABLE": "Dịch vụ danh tính hiện không khả dụng.",
        "errors.KEYCLOAK_CREDENTIALS_REJECTED": "Thông tin đăng nhập không đúng.",
        "errors.KEYCLOAK_EMAIL_REGISTERED": "Email này đã được đăng ký.",
        "errors.KEYCLOAK_PASSWORD_INVALID": "Mật khẩu không đáp ứng yêu cầu.",
        "errors.KEYCLOAK_SOCIAL_REJECTED": "Không thể hoàn tất đăng nhập bằng tài khoản mạng xã hội.",
    },
    en: {
        "errors.KEYCLOAK_UNAVAILABLE": "The identity provider is unavailable.",
        "errors.KEYCLOAK_CREDENTIALS_REJECTED": "The credentials were rejected.",
        "errors.KEYCLOAK_EMAIL_REGISTERED": "This email is already registered.",
        "errors.KEYCLOAK_PASSWORD_INVALID": "The password does not meet the requirements.",
        "errors.KEYCLOAK_SOCIAL_REJECTED": "The social sign-in could not be completed.",
    },
}
