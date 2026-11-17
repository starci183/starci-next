import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of the errors capability codes, Vietnamese and English. */
export const ERRORS_MESSAGES: MessageBundle = {
    vi: {
        "errors.ERRORS_INTERNAL": "\u0110\u00e3 x\u1ea3y ra l\u1ed7i kh\u00f4ng mong mu\u1ed1n.",
        "errors.ERRORS_ROUTE_NOT_FOUND": "\u0110\u1ecba ch\u1ec9 n\u00e0y kh\u00f4ng t\u1ed3n t\u1ea1i.",
    },
    en: {
        "errors.ERRORS_INTERNAL": "An unexpected error occurred.",
        "errors.ERRORS_ROUTE_NOT_FOUND": "This address does not exist.",
    },
}
