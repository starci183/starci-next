import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of entitlement errors, Vietnamese and English. */
export const ENTITLEMENT_MESSAGES: MessageBundle = {
    vi: {
        "errors.ENTITLEMENT_MISSING": "Không thể lưu quyền Premium.",
        "errors.ENTITLEMENT_DEV_GRANT_DISABLED": "Cấp Premium thử chỉ chạy được trong môi trường phát triển.",
    },
    en: {
        "errors.ENTITLEMENT_MISSING": "Could not save the Premium entitlement.",
        "errors.ENTITLEMENT_DEV_GRANT_DISABLED": "The trial Premium grant runs in the development environment only.",
    },
}
