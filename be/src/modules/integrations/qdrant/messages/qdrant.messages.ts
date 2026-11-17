import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of the Qdrant codes, Vietnamese and English. */
export const QDRANT_MESSAGES: MessageBundle = {
    vi: {
        "errors.QDRANT_UNAVAILABLE": "Không kết nối được kho vector.",
        "errors.QDRANT_REJECTED": "Kho vector từ chối lệnh {{call}} (mã {{status}}).",
        "errors.QDRANT_MISMATCH": "Bộ sưu tập {{collection}} có kích thước vector {{found}}, cần {{expected}}.",
        "errors.QDRANT_SCOPE_MISSING": "Tìm kiếm vector phải nêu bộ lọc phạm vi.",
    },
    en: {
        "errors.QDRANT_UNAVAILABLE": "The vector store could not be reached.",
        "errors.QDRANT_REJECTED": "The vector store refused the {{call}} call (status {{status}}).",
        "errors.QDRANT_MISMATCH": "Collection {{collection}} holds vectors of {{found}}, expected {{expected}}.",
        "errors.QDRANT_SCOPE_MISSING": "A vector search must name its scope filter.",
    },
}
