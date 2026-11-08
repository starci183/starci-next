import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of probe transport errors, Vietnamese and English. */
export const PROBE_MESSAGES: MessageBundle = {
    vi: {
        "errors.PROBE_TARGET_REFUSED": "Địa chỉ này trỏ vào mạng nội bộ nên không được kiểm tra.",
    },
    en: {
        "errors.PROBE_TARGET_REFUSED": "This address points into an internal network so it is not probed.",
    },
}
